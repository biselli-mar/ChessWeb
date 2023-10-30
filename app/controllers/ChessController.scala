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
import scala.concurrent.Future
import scala.concurrent.ExecutionContext


@Singleton
class ChessController @Inject()(ws: WSClient, config: Configuration, val controllerComponents: ControllerComponents)(implicit ec: ExecutionContext) extends BaseController {

  val controllerURL: String = config.get[String]("de.htwg.se.chess.ControllerUrl")

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

  def game() = asyncAction("/fen", GET, (r) => Ok(views.html.game(FenParser.matrixFromFen(r.body), FenParser.stateFromFen(r.body), PieceColor.White)))

  def put(tile: String, piece: String) = asyncAction("/cells", PUT, backToPlay, "tile" -> tile, "piece" -> piece)

  def move(from: String, to: String) = asyncAction("/moves", PUT, backToPlay, "from" -> from, "to" -> to)

  def clear = asyncAction("/cells", PUT, backToPlay, "clear" -> "true")

  def putWithFen(fen: String) = asyncAction("/fen", PUT, backToPlay, "fen" -> fen)

  def reset = putWithFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")

  def select(tile: Option[String]) = Action.async { implicit request: Request[AnyContent] =>
    val request = ws.url(controllerURL + "/states")
        .addHttpHeaders("Accept" -> "text/plain")
        .addQueryStringParameters("query" -> "selected")
    if (tile.isDefined) {
      request.addQueryStringParameters("tile" -> tile.get)
    }
    request
        .put("")
        .map { response =>
          response.status match {
            case 200 => SeeOther("/play")
            case _ => BadRequest(response.body)
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

}
