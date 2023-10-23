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

import controllers.routes
import play.api.http.HttpErrorHandler
import play.api.http.Status._
import play.api.mvc._
import play.api.mvc.Results._

import scala.concurrent._
import javax.inject.Singleton


@Singleton
class ErrorHandler extends HttpErrorHandler {
  def onClientError(request: RequestHeader, statusCode: Int, message: String): Future[Result] = {
    val optMessage: Option[String] = message.isBlank() match {
      case true => None
      case false => Some(message)
    }
    statusCode match {
      case BAD_REQUEST => Future.successful(Redirect(routes.ErrorController.badRequest(optMessage)))
      case FORBIDDEN => Future.successful(Redirect(routes.ErrorController.forbidden(optMessage)))
      case NOT_FOUND => Future.successful(Redirect(routes.ErrorController.notFound(optMessage)))
      case _ => Future.successful(Redirect(routes.ErrorController.genericError(Some(statusCode), optMessage), statusCode))
    }
  }

  def onServerError(request: RequestHeader, exception: Throwable): Future[Result] = {
    Future.successful(
      Redirect(routes.ErrorController.internalError(Some(exception.getMessage)))
    )
  }
}