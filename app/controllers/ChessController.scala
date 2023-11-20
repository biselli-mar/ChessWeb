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

import models.data._
import models.forms._

import de.htwg.se.chess.util.data._
import de.htwg.se.chess.util.data.ChessBoard._
import de.htwg.wa.http.HttpMethod
import de.htwg.wa.http.HttpMethod._

import scala.util.Try
import scala.util.Success
import scala.util.Failure

import javax.inject._
import com.google.inject.Guice
import play.api._
import play.api.mvc._
import play.api.libs.ws._
import play.api.libs.json._
import play.api.data.Form
import play.api.data.Forms._
import scala.concurrent.Future
import scala.concurrent.ExecutionContext


@Singleton
class ChessController @Inject()(
  ws: WSClient,
  config: Configuration,
  val controllerComponents: ControllerComponents)(implicit ec: ExecutionContext) 
extends BaseController
with play.api.i18n.I18nSupport {

  val moveForm = Form(
        mapping(
            "from" -> text,
            "to" -> text
        )(MoveForm.apply)(MoveForm.unapply)
    )

  val selectForm = Form(
        mapping(
            "tile" -> optional(text)
        )(SelectForm.apply)(SelectForm.unapply)
    )

  val fenForm = Form(
        mapping(
            "fen" -> text
        )(FenForm.apply)(FenForm.unapply)
    )

  val controllerURL: String = config.get[String]("de.htwg.se.chess.ControllerUrl")
  val legalityURL: String = config.get[String]("de.htwg.se.chess.LegalityUrl")

  def boardText(response: WSResponse) = toBoard(FenParser.matrixFromFen(response.body))

  def asyncAction(
    resourcePath: String,
    method: HttpMethod,
    success: WSResponse => Result,
    query: (String, String)*): Action[AnyContent] = Action.async { implicit request: Request[AnyContent] =>
      ws.url(controllerURL + resourcePath)
        .withMethod(method.toString())
        .addHttpHeaders("Accept" -> "text/plain")
        .addQueryStringParameters(query: _*)
        .execute()
        .map( response =>
            response.status match {
              case 200 => success(response)
              case _ => BadRequest(response.body)
            }
        )
    }

  def backToPlay(response: WSResponse) = SeeOther("/play")

  def index() = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.index())
  }

  def plainGame() = asyncAction("/fen", GET, (r) => Ok(views.html.plainGame(boardText(r))))

  def game = Action.async { implicit request: Request[AnyContent] =>
    ws.url(controllerURL + "/states")
      .addHttpHeaders("Accept" -> "text/plain")
      .addQueryStringParameters("query" -> "selected")
      .get()
      .flatMap { selectedResponse =>

    selectedResponse.status match {
      case 200 => {
        if (selectedResponse.body != "null") {
          ws.url(controllerURL + "/fen")
            .get()
            .flatMap { fenResponse =>
                  
        fenResponse.status match {
          case 200 => {
            ws.url(legalityURL + "/moves")
              .addQueryStringParameters("tile" -> selectedResponse.body)
              .withBody(s"{\"fen\": \"${fenResponse.body}\"}")
              .get()
              .map { legalityResponse =>
                legalityResponse.status match {
                  case 200 => {
                val legalMoves = (Json.parse(legalityResponse.body) \ (selectedResponse.body.filter(c => c != '"'))).get.as[List[String]]
                Ok(views.html.game(
                    FenParser.matrixFromFen(fenResponse.body),
                    FenParser.stateFromFen(fenResponse.body),
                    PieceColor.White,
                    Tile(legalMoves).map(tile => Tuple2(tile.row, tile.col)),
                    moveForm, selectForm, fenForm))
                }
                case _ => BadRequest(legalityResponse.body)
              }
            }
          }
          case _ => Future.successful(BadRequest(fenResponse.body))
          }
        }
              
        } else {
          ws.url(controllerURL + "/fen")
            .get()
            .map { response =>
              response.status match {
                case 200 => Ok(views.html.game(
                  FenParser.matrixFromFen(response.body),
                  FenParser.stateFromFen(response.body),
                  PieceColor.White,
                  List(),
                  moveForm, selectForm, fenForm))
                case _ => BadRequest(response.body)
              }
            }
        }
      }
      case _ => Future.successful(BadRequest(selectedResponse.body))
    }
  }

    
  }

  def put(tile: String, piece: String) = asyncAction("/cells", PUT, backToPlay, "tile" -> tile, "piece" -> piece)

  def move = Action.async(parse.form(moveForm)) { implicit request: Request[MoveForm] =>
    val moveData: MoveForm = request.body
    ws.url(controllerURL + "/moves")
      .addQueryStringParameters("from" -> s"\"${moveData.from}\"", "to" -> s"\"${moveData.to}\"")
      .put("")
      .map { response =>
        response.status match {
          case 200 => SeeOther("/play")
          case _ => BadRequest(response.body)
        }
      }
  }

  def clear = asyncAction("/cells", PUT, backToPlay, "piece" -> "k", "clear" -> "true")

  def putWithFen = Action.async(parse.form(fenForm)) { implicit request: Request[FenForm] =>
    val fenData: FenForm = request.body
    ws.url(controllerURL + "/fen")
      .addQueryStringParameters("fen" -> fenData.fen)
      .put("")
      .map { response =>
        response.status match {
          case 200 => SeeOther("/play")
          case _ => BadRequest(response.body)
        }
      }
  }

  def reset = asyncAction("/fen", PUT, backToPlay, "fen" -> "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")

  def select = Action.async(parse.form(selectForm)) { implicit request: Request[SelectForm] => {
    val selectData: SelectForm = request.body
    val wsReq = ws.url(controllerURL + "/states")
        .addQueryStringParameters("query" -> "selected")
    if (selectData.tile.isDefined) {
      ws.url(controllerURL + "/fen")
        .get()
        .flatMap { fenResponse =>
      fenResponse.status match {
      case 200 => {
        ws.url(legalityURL + "/moves")
              .addQueryStringParameters("tile" -> s"\"${selectData.tile.get}\"")
              .withBody(s"{\"fen\": \"${fenResponse.body}\"}")
              .get()
              .flatMap { legalityResponse =>
                legalityResponse.status match {
                  case 200 => {
                val legalMovesJsValue = (Json.parse(legalityResponse.body) \ (selectData.tile.get)).get
                val legalMoves = legalMovesJsValue.as[List[String]]
                wsReq
                  .addQueryStringParameters("tile" -> s"\"${selectData.tile.get}\"")
                  .put("")
                  .map { response =>
                    response.status match {
                      case 200 => Ok(legalMovesJsValue)
                      case _ => BadRequest(response.body + " \n in selecting")
                    }
                  }
                }
                case _ => Future.successful(BadRequest(legalityResponse.body + " \n at legality"))
              }
            }
      }
      case _ => 
          Future.successful(BadRequest(fenResponse.body + " \n at fenGet"))
        }
      }
    } else {
      wsReq
        .put("")
        .map { response =>
          response.status match {
            case 200 => SeeOther("/play")
            case _ => BadRequest(response.body + " \n no tile defined")
          }
        }
      }
    }
  }

  def start = asyncAction("/states", PUT, backToPlay, "query" -> "playing", "state" -> "true")

  def stop  = asyncAction("/states", PUT, backToPlay, "query" -> "playing", "state" -> "false")

  def undo  = asyncAction("/undo", PUT, backToPlay)

  def redo  = asyncAction("/redo", PUT, backToPlay)

  def about() = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.about())
  }

  def notFinished() = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.notFinished())
  }

  def getLegalMoves = Action.async { implicit request: Request[AnyContent] =>
    ws.url(controllerURL + "/fen")
      .get()
      .flatMap { fenResponse =>
        fenResponse.status match {
          case 200 => {
            ws.url(legalityURL + "/moves")
              .withBody(s"{\"fen\": \"${fenResponse.body}\"}")
              .get()
              .map { legalityResponse =>
                legalityResponse.status match {
                  case 200 => {
                    Ok(legalityResponse.body)
                  }
                  case _ => BadRequest(legalityResponse.body)
                }
              }
          }
          case _ => Future.successful(BadRequest(fenResponse.body))
        }
      }
  }

  def getPosition = Action.async { implicit request: Request[AnyContent] =>
    ws.url(controllerURL + "/fen")
      .get()
      .map { fenResponse =>
        fenResponse.status match {
          case 200 => {
            val matrixMap = FenParser.mapFromFen(fenResponse.body)
            val state = FenParser.stateFromFen(fenResponse.body)
            val body = Json.toJson(matrixMap.map({ case (tile, piece) => (tile.toString, piece.toHtmlString) }))
            Ok(body)
          }
          case _ => BadRequest(fenResponse.body)
        }
      }
  }

}
