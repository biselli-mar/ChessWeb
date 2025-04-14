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
import models.json.Parsers._

import de.htwg.se.chess.util.data._
import de.htwg.se.chess.util.data.ChessBoard._

import scala.util.Try
import scala.util.Success
import scala.util.Failure

import akka.http.scaladsl.model.HttpMethod
import akka.http.scaladsl.model.HttpMethods._
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


@Singleton
class ChessController @Inject()(
  ws: WSClient,
  config: Configuration,
  val controllerComponents: ControllerComponents)(implicit ec: ExecutionContext) 
extends BaseController
with play.api.i18n.I18nSupport {

  def index() = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.index())
  }

  def game = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.game(PieceColor.White))
  }

  def about() = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.about())
  }

  def notFinished() = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.notFinished())
  }
}
