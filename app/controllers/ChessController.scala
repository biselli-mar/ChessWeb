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

  /**
   * Create an Action to render an HTML page.
   *
   * The configuration in the `routes` file means that this method
   * will be called when the application receives a `GET` request with
   * a path of `/`.
   */
  def index() = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.index())
  }

  def plainGame() = Action.async { implicit request: Request[AnyContent] =>
    ws.url(controllerURL + "/fen")
        .addHttpHeaders("Accept" -> "text/plain")
        .get()
        .map { response =>
          response.status match {
            case 200 => Ok(views.html.plainGame(boardText(response)))
            case _ => BadRequest(response.body)
          }
        }
  }

  def put(tile: String, piece: String) = Action.async { implicit request: Request[AnyContent] =>
    ws.url(controllerURL + "/cells")
        .addHttpHeaders("Accept" -> "text/plain")
        .addQueryStringParameters("tile" -> tile, "piece" -> piece)
        .put("")
        .map { response =>
          response.status match {
            case 200 => SeeOther("/play")
            case _ => BadRequest(response.body)
          }
        }
  }

  def move(from: String, to: String) = Action.async { implicit request: Request[AnyContent] =>
    ws.url(controllerURL + "/moves")
        .addHttpHeaders("Accept" -> "text/plain")
        .addQueryStringParameters("from" -> from, "to" -> to)
        .put("")
        .map { response =>
          response.status match {
            case 200 => SeeOther("/play")
            case _ => BadRequest(response.body)
          }
        }
  }

  def clear = Action.async { implicit request: Request[AnyContent] =>
    ws.url(controllerURL + "/cells")
        .addHttpHeaders("Accept" -> "text/plain")
        .addQueryStringParameters("clear" -> "true")
        .put("")
        .map { response =>
          response.status match {
            case 200 => SeeOther("/play")
            case _ => BadRequest(response.body)
          }
        }
  }

  def putWithFen(fen: String) = Action.async { implicit request: Request[AnyContent] =>
    ws.url(controllerURL + "/fen")
        .addHttpHeaders("Accept" -> "text/plain")
        .addQueryStringParameters("fen" -> fen)
        .put("")
        .map { response =>
          response.status match {
            case 200 => SeeOther("/play")
            case _ => BadRequest(response.body)
          }
        }
  }

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

  def start = Action.async { implicit request: Request[AnyContent] =>
    ws.url(controllerURL + "/states")
        .addHttpHeaders("Accept" -> "text/plain")
        .addQueryStringParameters("query" -> "playing", "state" -> "true")
        .put("")
        .map { response =>
          response.status match {
            case 200 => SeeOther("/play")
            case _ => BadRequest(response.body)
          }
        }
  }

  def stop = Action.async { implicit request: Request[AnyContent] =>
    ws.url(controllerURL + "/states")
        .addHttpHeaders("Accept" -> "text/plain")
        .addQueryStringParameters("query" -> "playing", "state" -> "true")
        .put("")
        .map { response =>
          response.status match {
            case 200 => SeeOther("/play")
            case _ => BadRequest(response.body)
          }
        }
  }

  def undo = Action.async { implicit request: Request[AnyContent] =>
    ws.url(controllerURL + "/undo")
        .addHttpHeaders("Accept" -> "text/plain")
        .put("")
        .map { response =>
          response.status match {
            case 200 => SeeOther("/play")
            case _ => BadRequest(response.body)
          }
        }
  }

  def redo = Action.async { implicit request: Request[AnyContent] =>
    ws.url(controllerURL + "/redo")
        .addHttpHeaders("Accept" -> "text/plain")
        .put("")
        .map { response =>
          response.status match {
            case 200 => SeeOther("/play")
            case _ => BadRequest(response.body)
          }
        }
  }
}
