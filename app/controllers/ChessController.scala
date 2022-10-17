package controllers

import com.google.inject.Guice
import de.htwg.se.chess.ChessModule
import de.htwg.se.chess.model._
import de.htwg.se.chess.controller.controllerComponent.ControllerInterface

import javax.inject._
import play.api._
import play.api.mvc._

/**
 * This controller creates an `Action` to handle HTTP requests to the
 * application's home page.
 */
@Singleton
class ChessController @Inject()(val controllerComponents: ControllerComponents) extends BaseController {

  val injector = Guice.createInjector(new ChessModule)
  val controller = injector.getInstance(classOf[ControllerInterface])

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

  def move(src: String, dest: String) = Action { implicit request: Request[AnyContent] =>
    controller.executeAndNotify(controller.move, (Tile(src, controller.size), Tile(dest, controller.size)))
    Ok(controller.fieldToString)
  }
}
