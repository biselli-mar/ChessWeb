package controllers

import com.google.inject.Guice
import de.htwg.se.chess.ChessModule
import de.htwg.se.chess.model._
import de.htwg.se.chess.controller.controllerComponent.ControllerInterface

import scala.util.Try
import scala.util.Success
import scala.util.Failure

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

  def plainGame() = Action { implicit request: Request[AnyContent] =>
    Ok(views.html.plainGame(controller.fieldToString))  
  }

  def put(tile: String, piece: String) = Action { implicit request: Request[AnyContent] =>
    controller.executeAndNotify(controller.put, (Tile(tile, controller.size), piece))
    Ok(controller.fieldToString)
  }

  def move(src: String, dest: String) = Action { implicit request: Request[AnyContent] =>
    controller.executeAndNotify(controller.move, (Tile(src, controller.size), Tile(dest, controller.size)))
    Ok(controller.fieldToString)
  }

  def clear = Action { implicit request: Request[AnyContent] =>
    controller.executeAndNotify(controller.clear, ())
    Ok(controller.fieldToString)
  }

  def putWithFen(fen: String) = Action { implicit request: Request[AnyContent] =>
    controller.executeAndNotify(controller.putWithFen, fen)
    Ok(controller.fieldToString)
  }

  def select(tile: Option[Tile]) = Action { implicit request: Request[AnyContent] =>
    controller.executeAndNotify(controller.select, tile)
    Ok(controller.fieldToString)
  }

  def start = Action { implicit request: Request[AnyContent] =>
    controller.start
    Ok(controller.fieldToString)
  }

  def stop = Action { implicit request: Request[AnyContent] =>
    controller.stop
    Ok(controller.fieldToString)
  }

  def undo = Action { implicit request: Request[AnyContent] =>
    controller.undo
    Ok(controller.fieldToString)
  }

  def redo = Action { implicit request: Request[AnyContent] =>
    controller.redo
    Ok(controller.fieldToString)
  }

  def notFound: Action[AnyContent] = Action { implicit request: Request[AnyContent] =>
    NotFound(views.html.notFound())
  }

  def badRequest(errorMessage: String) = Action {
    BadRequest(errorMessage + "\n")
  }
}
