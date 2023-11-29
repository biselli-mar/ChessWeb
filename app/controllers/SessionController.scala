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

    val openSessions = scala.collection.mutable.Map[String, Either[ActorRef, Tuple2[ActorRef, ActorRef]]]()

    val createSessionForm = Form(
        mapping(
            "play-white" -> boolean
        )(CreateSessionForm.apply)(CreateSessionForm.unapply)
    )

    def newSessions = Action { implicit request: Request[AnyContent] =>
        Ok(views.html.newSessions())
    }

    def findSession = Action { implicit request: Request[AnyContent] =>
        Ok(views.html.findSession())
    }

    def createSession = Action.async(parse.form(createSessionForm)) { implicit request: Request[CreateSessionForm] =>
        val formData: CreateSessionForm = request.body
        // create new session
        ws.url(controllerURL + "/session")
          .withQueryStringParameters("play-white" -> formData.playAsWhite.toString)
          .post("")
          .map { response =>
            response.status match {
                case 201 => Created(response.body)
                case _ => InternalServerError(response.body)
            }
        }
    }

    def joinSession(sessionId: String) = Action.async { implicit request: Request[AnyContent] =>
        // join session
        ws.url(controllerURL + "/session/join")
          .withQueryStringParameters("session" -> sessionId)
          .post("")
          .map { response =>
            response.status match {
                case 200 => Ok(response.body)
                case _ => InternalServerError(response.body)
            }
        }
    }

    def deleteSession(sessionId: String) = Action.async { implicit request: Request[AnyContent] =>
        // delete session
        ws.url(controllerURL + "/session/")
          .withQueryStringParameters("session" -> sessionId)
          .delete()
          .map { response =>
            response.status match {
                case 200 => Ok(response.body)
                case _ => InternalServerError(response.body)
            }
        }
    }

    def socket(sessionId: String) = WebSocket.acceptOrResult[JsValue, JsValue] { request =>
        Future.successful(
            if (!openSessions.contains(sessionId)) {
                Right(ActorFlow.actorRef(SessionActor.props(_ , sessionId)))
            }
            else {
                openSessions(sessionId) match {
                    case Left(_) => Right(ActorFlow.actorRef(SessionActor.props(_ , sessionId)))
                    case Right(_) => Left(Forbidden)
            }
        })
        
    }

    class SessionActor(client: ActorRef, sessionId: String) extends Actor {
        if (openSessions.contains(sessionId)) { // joining existing session
            val hostActorRef = openSessions(sessionId) match {
                case Left(actorRef) => actorRef
                case Right(tuple) => throw new Exception("Session already filled")
            }
            openSessions += (sessionId -> Right((hostActorRef, client)))
            gameJsonData(sessionId).recover {
                case e: Exception => Json.obj("error" -> e.getMessage)
            }.collect({
                case json: JsObject => {
                    hostActorRef ! json.toString
                    client ! json.toString
                }
            })
        } else {                                // creating new session
            openSessions += (sessionId -> Left(client))
            client ! JsString("Wait for opponent")
        }

        def receive = {
            case msg: JsValue => {
                if(msg.toString().equals("Keep alive")) {
                    client ! JsString("Keep alive")
                } else {
                    val eitherActorRefs: Either[ActorRef, Tuple2[ActorRef, ActorRef]] = openSessions(sessionId)

                    eitherActorRefs match {
                        case Left(actorRef) =>
                            if ((msg \ "endSession").isDefined) {
                                openSessions -= sessionId
                                actorRef ! PoisonPill
                            } else {
                                actorRef ! Json.obj("error" -> "Waiting for second player")
                            }
                            client ! Json.obj("error" -> "Waiting for second player")
                        case Right(actorRefs) => {
                            handleIncomingSocketMessage(sessionId, msg, actorRefs)
                        }
                    }
                }
            }
        }
    }

    def handleIncomingSocketMessage(sessionId: String, msg: JsValue, actorRefs: Tuple2[ActorRef, ActorRef]) = {
        val tryMoveData = Try(Json.fromJson[MoveData](msg).get)

        tryMoveData match {
            case Success(gameData) => {
                move(Json.fromJson[MoveData](msg).get, sessionId).map { response =>
                    response.status match {
                        case 200 => {
                            gameJsonData(sessionId).recover {
                                case e: Exception => Json.obj("error" -> e.getMessage)
                            }.collect({
                                case json: JsObject => {
                                    actorRefs._1 ! json
                                    actorRefs._2 ! json
                                }
                            })
                        }
                        case _ => InternalServerError(response.body)
                    }
                }
            }
            case Failure(_) => {
                if ((msg \ "endSession").isDefined) {
                    openSessions -= sessionId
                    actorRefs._1 ! PoisonPill
                    actorRefs._2 ! PoisonPill
                } else {
                    actorRefs._1 ! Json.obj("error" -> "Invalid message")
                    actorRefs._2 ! Json.obj("error" -> "Invalid message")
                }
            }
        }
    }

    object SessionActor {
        def props(client: ActorRef, sessionId: String) = Props(new SessionActor(client, sessionId))
    }

    def gameJsonData(sessionId: String): Future[JsObject] = {
        val futureResponse: Future[Tuple3[WSResponse, WSResponse, WSResponse]] = for {
          fenResponse   <- ws.url(controllerURL + "/fen").addQueryStringParameters("session" -> sessionId).get()
          stateResponse <- ws.url(controllerURL + "/states?query=check").addQueryStringParameters("session" -> sessionId).get()
          gameStateResponse    <- ws.url(controllerURL + "/states?query=game-state").addQueryStringParameters("session" -> sessionId).get()
        } yield Tuple3(fenResponse, stateResponse, gameStateResponse)

        futureResponse.collect({
          case (fenResponse, stateResponse, gameStateResponse)
          if fenResponse.status == 200 && stateResponse.status == 200 && gameStateResponse.status == 200 => {
            val matrixMap = FenParser.mapFromFen(fenResponse.body)
            val state = FenParser.stateFromFen(fenResponse.body)
            Json.obj(
              "pieces" -> Json.toJson(matrixMap.map({ case (tile, piece) => (tile.toString, piece.toHtmlString) })),
              "state" -> Json.toJson(state),
              "check" -> Json.toJson(stateResponse.body.toBoolean),
              "game-state" -> Json.toJson(gameStateResponse.body),
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
    
}