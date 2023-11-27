package models.json

import play.api.libs.json._
import play.api.libs.functional.syntax._

import de.htwg.se.chess.util.data.ChessState

object Parsers {
    implicit val chessStateWrites: Writes[ChessState] = (
      (JsPath \ "playing").write[Boolean] and
        (JsPath \ "color").write[String] and
        (JsPath \ "halfMoves").write[Int] and
        (JsPath \ "fullMoves").write[Int]
    )(s => (s.playing, s.color.toFenChar, s.halfMoves, s.fullMoves))
}