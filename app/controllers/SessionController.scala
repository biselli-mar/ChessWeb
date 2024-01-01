/*                                                                                      *\
**     _________  ______________________                                                **
**    /  ___/  / /  /  ____/  ___/  ___/        2023 Emanuel Kupke & Marcel Biselli     **
**   /  /  /  /_/  /  /__  \  \  \  \           https://github.com/emanuelk02/Chess     **
**  /  /__/  __   /  /___ __\  \__\  \                                                  **
**  \    /__/ /__/______/______/\    /         Software Engineering | HTWG Constance    **
**   \__/                        \__/                                                   **
**                                                                                      **
\*                                                                                      */


package controllers

//import models.actors.SessionActor
import models.data._
import models.forms._
import models.json.Parsers._

import de.htwg.se.chess.util.data._
import de.htwg.se.chess.util.data.ChessBoard._
import de.htwg.wa.http.HttpMethod
import de.htwg.wa.http.HttpMethod._


import javax.inject._
import com.google.inject.Guice

import play.api._
import play.api.mvc._
import play.api.libs.ws._
import play.api.libs.json._
import play.api.data.Form
import play.api.data.Forms._
import play.api.libs.streams.ActorFlow

import scala.concurrent.Future
import scala.concurrent.ExecutionContext
import scala.util.{Either, Left, Right, Try, Success, Failure}

import akka.stream.Materializer
import akka.actor._


@Singleton
class SessionController @Inject()(
  ws: WSClient,
  config: Configuration,
  val controllerComponents: ControllerComponents)(implicit ec: ExecutionContext, system: ActorSystem, mat: Materializer) 
extends BaseController
with play.api.i18n.I18nSupport {

    val controllerURL: String = config.get[String]("de.htwg.se.chess.ControllerUrl")
    val legalityURL: String = config.get[String]("de.htwg.se.chess.LegalityUrl")

    val pendingSessions = scala.collection.mutable.Map[String, PieceColor]()
    val openSessions = scala.collection.mutable.Map[String, SessionData]()

    val createSessionForm = Form(
        mapping(
            "playWhite" -> boolean
        )(CreateSessionForm.apply)(CreateSessionForm.unapply)
    )

    val joinSessionForm = Form(
        mapping(
            "sessionId" -> text
        )(JoinSessionForm.apply)(JoinSessionForm.unapply)
    )

    def newSessions = Action { implicit request: Request[AnyContent] =>
        Ok(views.html.newSessions(createSessionForm))
    }

    def findSession = Action { implicit request: Request[AnyContent] =>
        Ok(views.html.findSession(joinSessionForm))
    }

    def createSession = Action.async(parse.form(createSessionForm)) { implicit request: Request[CreateSessionForm] =>
        val formData: CreateSessionForm = request.body
        println(s"Creating pending session: " + formData)
        // create new session
        ws.url(controllerURL + "/session")
          .withQueryStringParameters("play-white" -> formData.playAsWhite.toString)
          .post("")
          .map { response =>
            response.status match {
                case 201 => {
                    val responseJson = Json.parse(response.body)
                    val sessionId = (responseJson \ "session").as[String]
                    if (formData.playAsWhite) {
                        pendingSessions += (sessionId -> PieceColor.White)
                    } else {
                        pendingSessions += (sessionId -> PieceColor.Black)
                    }
                    Created(responseJson)
                }   
                case _ => InternalServerError(response.body)
            }
        }
    }

    def joinSession = Action.async(parse.form(joinSessionForm)) { implicit request: Request[JoinSessionForm] =>
        val sessionId: String = request.body.sessionId
        println(s"#${sessionId} - Joining session")
        // join session
        ws.url(controllerURL + "/session/join")
          .withQueryStringParameters("session" -> sessionId)
          .post("")
          .map { response =>
            response.status match {
                case 200 => Ok(Json.parse(response.body))
                case _ => InternalServerError(response.body)
            }
        }
    }

    def deleteSession(sessionId: String) = Action.async { implicit request: Request[AnyContent] =>
        // delete session
        ws.url(controllerURL + "/session")
          .withQueryStringParameters("session" -> sessionId)
          .delete()
          .map { response =>
            response.status match {
                case 200 => Ok(response.body)
                case _ => InternalServerError(response.body)
            }
        }
    }

    def socket(sessionId: String) = WebSocket.acceptOrResult[String, String] { request =>
        Future.successful(
            if (pendingSessions.contains(sessionId)) {
                println(s"#${sessionId} - Opening socket; new game")
                Right(ActorFlow.actorRef(SessionActor.props(_ , sessionId, pendingSessions(sessionId))))
            }
            else {
                openSessions(sessionId).actorRefs match {
                    case Left(_) => {
                        println(s"#${sessionId} - Opening socket; joining game")
                        Right(ActorFlow.actorRef(SessionActor.props(_ , sessionId, openSessions(sessionId).guestColor)))
                    }
                    case Right(_) => {
                        println(s"#${sessionId} - Deny socket; game is already full")
                        Left(Forbidden)
                    }
            }
        })
        
    }

    class SessionActor(client: ActorRef, sessionId: String, color: PieceColor) extends Actor {
        if (openSessions.contains(sessionId)) { // joining existing session
            println(s"#${sessionId} - Joining existing session")
            val sessionData = openSessions(sessionId)
            val hostActorRef = sessionData.actorRefs match {
                case Left(actorRef) => actorRef
                case Right(tuple) => throw new Exception("Session already filled")
            }
            openSessions += (sessionId -> SessionData(sessionId, sessionData.hostIsWhite, Right((hostActorRef, client))))
            gameJsonData(sessionId).recover {
                case e: Exception => 
                    val errorObj = Json.obj("error" -> e.getMessage)
                    println(s"#${sessionId} - Encountered error: " + errorObj)
                    client ! errorObj.toString()
            }.collect({
                case json: JsObject => {
                    println("Starting game: " + sessionId)
                    val hostResponseJson = json + ("player-color" -> JsString(sessionData.hostColor.toFenChar))
                    val guestResponseJson = json + ("player-color" -> JsString(sessionData.guestColor.toFenChar))
                    hostActorRef ! hostResponseJson.toString()
                    client ! guestResponseJson.toString()
                }
            })
        } else {                                // creating new session
            println(s"#${sessionId} - Creating new session")
            val pendingSession = pendingSessions(sessionId)
            openSessions += (sessionId -> SessionData(sessionId, (pendingSession == PieceColor.White), Left(client)))
            pendingSessions -= sessionId
            client ! "Wait for opponent"
        }

        override def postStop() = {
            println(s"#${sessionId} - Actor terminated")
            ws.url(controllerURL + "/session")
              .withQueryStringParameters("session" -> sessionId)
              .delete()
        }

        def receive = {
            case msg: String => {
                if(msg.toString().equals("Keep alive")) {
                    client ! "Keep alive"
                } else {
                    println(s"#${sessionId} - Received msg: " + msg.toString())
                    val eitherActorRefs: Either[ActorRef, Tuple2[ActorRef, ActorRef]] = openSessions(sessionId).actorRefs
                    val jsonContent = Json.parse(msg)
                    eitherActorRefs match {
                        case Left(actorRef) =>
                            if ((jsonContent \ "endSession").isDefined) {
                                println(s"#${sessionId} - Cancelling session")
                                openSessions -= sessionId
                                actorRef ! PoisonPill
                            } else {
                                println("Impatient player")
                                actorRef ! Json.obj("error" -> "Waiting for second player").toString()
                            }
                        case Right(actorRefs) => {
                            handleIncomingSocketMessage(sessionId, jsonContent, color, client, actorRefs)
                        }
                    }
                }
            }
            case _ =>
                println("Invalid message")
        }
    }

    def handleIncomingSocketMessage(sessionId: String, msg: JsValue, color: PieceColor, initiator: ActorRef, bothActors: Tuple2[ActorRef, ActorRef]) = {
        val tryMoveData = Try(Json.fromJson[MoveData](msg).get)

        tryMoveData match {
            case Success(moveData) => {
                println("Moving piece: " + moveData.from + " to " + moveData.to)
                move(moveData, sessionId).map { response =>
                    response.status match {
                        case 200 => {
                            gameJsonData(sessionId).recover {
                                case e: Exception => 
                                    val errorObj = Json.obj("error" -> e.getMessage)
                                    println(s"#${sessionId} - Encountered error: " + errorObj)
                                    initiator ! errorObj.toString()
                            }.collect({
                                case json: JsObject => {
                                    val sendJson = json + ("move" -> Json.obj(
                                        "from" -> moveData.from,
                                        "to" -> moveData.to
                                    ))
                                    println(s"#${sessionId} - Processing move: " + sendJson)
                                    bothActors._1 ! sendJson.toString()
                                    bothActors._2 ! sendJson.toString()
                                }
                            })
                        }
                        case _ =>
                            println(s"#${sessionId} - Encountered error: " + response.body)
                            val errorObj = Json.obj("error" -> response.body)
                            initiator ! errorObj.toString()
                    }
                }
            }
            case Failure(e) => {
                if ((msg \ "endSession").isDefined) {
                    println(s"#${sessionId} - Ending session")
                    openSessions -= sessionId
                    bothActors._1 ! PoisonPill
                    bothActors._2 ! PoisonPill
                } else {
                    println("Invalid message; error: " + e.toString())
                    initiator ! Json.obj("error" -> ("Invalid message: " + msg.toString())).toString()
                }
            }
        }
    }

    object SessionActor {
        def props(client: ActorRef, sessionId: String, color: PieceColor) = Props(new SessionActor(client, sessionId, color))
    }

    def gameJsonData(sessionId: String): Future[JsObject] = {
        val futureResponse: Future[Tuple4[WSResponse, WSResponse, WSResponse, WSResponse]] = for {
          fenResponse       <- ws.url(controllerURL + "/fen").addQueryStringParameters("session" -> sessionId).get()
          stateResponse     <- ws.url(controllerURL + "/states?query=check").addQueryStringParameters("session" -> sessionId).get()
          gameStateResponse <- ws.url(controllerURL + "/states?query=game-state").addQueryStringParameters("session" -> sessionId).get()
          legalityResponse  <- ws.url(legalityURL   + "/moves").withBody(s"{\"fen\": \"${fenResponse.body}\"}").get()
        } yield Tuple4(fenResponse, stateResponse, gameStateResponse, legalityResponse)

        futureResponse.collect({
          case (fenResponse, stateResponse, gameStateResponse, legalityResponse)
          if fenResponse.status == 200 && stateResponse.status == 200 && gameStateResponse.status == 200 => {
            val matrixMap = FenParser.mapFromFen(fenResponse.body)
            val state = FenParser.stateFromFen(fenResponse.body)
            Json.obj(
              "pieces" -> Json.toJson(matrixMap.map({ case (tile, piece) => (tile.toString, piece.toHtmlString) })),
              "state" -> Json.toJson(state),
              "check" -> Json.toJson(stateResponse.body.toBoolean),
              "game-state" -> Json.toJson(gameStateResponse.body),
              "legal-moves" -> Json.parse(legalityResponse.body)
            )
          }
        })
    }

    def move(moveData: MoveData, sessionId: String): Future[WSResponse] = {
        ws.url(controllerURL + "/moves")
          .addQueryStringParameters(
            "session" -> sessionId,
            "player" -> moveData.playerId,
            "from" -> s"\"${moveData.from}\"",
            "to" -> s"\"${moveData.to}\""
          ).put("")
    }
    
    def playerState(sessionId: String, playerId: String) = Action.async { implicit request: Request[AnyContent] =>
        if (pendingSessions.get(sessionId).isDefined) {
            val fen = FenParser.defaultFen
            val pieces = FenParser.mapFromFen(fen).map({ case (tile, piece) => (tile.toString, piece.toHtmlString) })
            Future.successful(
                Ok(Json.obj(
                    "color" -> pendingSessions(sessionId).toFenChar,
                    "pieces" -> Json.toJson(pieces)
            )))
        } else {
            println(s"#${sessionId} - Getting player state")
            ws.url(controllerURL + "/session/player-state")
              .addQueryStringParameters(
                "session" -> sessionId,
                "player" -> playerId
              )
              .get()
              .map { response =>
                response.status match {
                    case 200 => {
                        val responseJson = Json.parse(response.body)
                        val fen = (responseJson \ "field").as[String]
                        val pieces = FenParser.mapFromFen(fen).map({ case (tile, piece) => (tile.toString, piece.toHtmlString) })
                        
                        Ok(
                            Json.obj(
                                "pieces" -> Json.toJson(pieces),
                                "color" -> (responseJson \ "color").as[String],
                            )
                        )
                    }
                    case _ => {
                        Status(response.status)(response.body)
                    }
                }
            }
        }
    }
}