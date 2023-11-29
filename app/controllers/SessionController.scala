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
import play.api.libs.streams.ActorFlow
import scala.concurrent.Future
import scala.concurrent.ExecutionContext
import akka.actor.ActorSystem
import akka.stream.Materializer


@Singleton
class SessionController @Inject()(
  ws: WSClient,
  config: Configuration,
  val controllerComponents: ControllerComponents)(implicit ec: ExecutionContext, system: ActorSystem, mat: Materializer) 
extends BaseController
with play.api.i18n.I18nSupport {

    val controllerURL: String = config.get[String]("de.htwg.se.chess.ControllerUrl")

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

    def joinSession(sessionId: String) = ???

    def deleteSession(sessionId: String) = ??? // TODO

    def socket = WebSocket.accept[String, String] { request =>
        request.session
        ActorFlow.actorRef { out =>
            SessionActor.props(out)
        }
    }

    class SessionActor(out: ActorRef, sessionId: String) extends Actor {
        def receive = {
            case msg: String =>
                out ! ("I received your message: " + msg)
        }
    }
}