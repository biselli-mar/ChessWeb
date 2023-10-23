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

import scala.util.Try
import scala.util.Success
import scala.util.Failure

import javax.inject._
import com.google.inject.Guice
import play.api._
import play.api.mvc._
import play.api.libs.ws._
import play.api.http.Status._
import scala.concurrent.Future
import scala.concurrent.ExecutionContext

import views.html.error

@Singleton
class ErrorController @Inject()(ws: WSClient, val controllerComponents: ControllerComponents)(implicit ec: ExecutionContext) extends BaseController {
    def notFound(message: Option[String]) = Action { implicit request: Request[AnyContent] =>
        NotFound(error(NOT_FOUND, Some(message.getOrElse("The requested resource could not be found."))))
    }

    def badRequest(message: Option[String]) = Action {
        BadRequest(error(BAD_REQUEST, Some(message.getOrElse("Invalid request."))))
    }

    def forbidden(message: Option[String]) = Action { implicit request: Request[AnyContent] =>
        Forbidden(error(FORBIDDEN, Some("You do not have access to this resource.\n-- " + message.getOrElse("Unknown error."))))
    }

    def internalError(message: Option[String]) = Action { implicit request: Request[AnyContent] =>
        InternalServerError(error(INTERNAL_SERVER_ERROR, Some("Something on our side went wrong:\n-- " + message.getOrElse("Unknown error."))))
    }

    def genericError(statusCode: Option[Int], message: Option[String]) = Action { implicit request: Request[AnyContent] =>
        Status(statusCode.getOrElse(500))(error(statusCode.getOrElse(500), message))
    }


    def redirected(statusCode: Int, url: String) = Action { implicit request: Request[AnyContent] =>
        if (url.isBlank()) { // TODO: Proper url regex
            InternalServerError(views.html.badRedirect())
        } else {
            if (statusCode >= 300 && statusCode < 400) {
                Status(statusCode)(views.html.redirect(statusCode, url))
            } else {
                Status(IM_A_TEAPOT)(views.html.redirect(IM_A_TEAPOT, url))
            }
        }
    }
}