import controllers.routes
import play.api.http.HttpErrorHandler
import play.api.http.Status.{BAD_REQUEST, NOT_FOUND}
import play.api.mvc._
import play.api.mvc.Results._

import scala.concurrent._
import javax.inject.Singleton

@Singleton
class ErrorHandler extends HttpErrorHandler {
  def onClientError(request: RequestHeader, statusCode: Int, message: String): Future[Result] = {
      if(statusCode == NOT_FOUND)
        Future.successful(Redirect(routes.ChessController.notFound))
      else if(statusCode == BAD_REQUEST)
        Future.successful(Status(statusCode)("A client error occurred and is handled differently  : " + message))
      else
        Future.successful(Status(statusCode)("This " + statusCode + " Code has currently no custom handling"))
  }

  def onServerError(request: RequestHeader, exception: Throwable): Future[Result] = {
    Future.successful(
      InternalServerError("An internal server error has occurred: " + exception.getMessage)
    )
  }
}