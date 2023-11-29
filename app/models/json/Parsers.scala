package models
package json

import play.api.libs.json._
import play.api.libs.functional.syntax._

import data.{GameData, MoveData}

import de.htwg.se.chess.util.data._
import de.htwg.se.chess.util.data.Piece._

object Parsers {
    implicit val tileWrites = new Writes[Tile] {
      def writes(tile: Tile): JsValue = 
        JsString(tile.toString)
    }

    implicit val tileReads: Reads[Tile] = 
      JsPath.read[String].map(Tile(_))

    implicit val pieceWrites = new Writes[Piece] {
      def writes(piece: Piece): JsValue = 
        JsString(piece.toHtmlString)
    }

    implicit val pieceReads: Reads[Piece] = 
      JsPath.read[String].map({
          case "wk" => W_KING
          case "wq" => W_QUEEN
          case "wr" => W_ROOK
          case "wb" => W_BISHOP
          case "wn" => W_KNIGHT
          case "wp" => W_PAWN
          case "bk" => B_KING
          case "bq" => B_QUEEN
          case "br" => B_ROOK
          case "bb" => B_BISHOP
          case "bn" => B_KNIGHT
          case "bp" => B_PAWN
        }
      )

    implicit val pieceColorWrites = new Writes[PieceColor] {
      def writes(color: PieceColor): JsValue = 
        JsString(color.toFenChar)
    }

    implicit val pieceColorReads: Reads[PieceColor] = 
      JsPath.read[String].map({
          case "w" => PieceColor.White
          case "b" => PieceColor.Black
        }
      )

    implicit val castlesWrites = new Writes[Castles] {
      def writes(castles: Castles): JsValue = 
        JsString(castles.toString)
    }

    implicit val castlesReads: Reads[Castles] = 
      JsPath.read[String].map({
        case str: String if str.length == 0 => Castles(false, false)
        case str: String if str.length == 1 => {
          if (str == "k") {
            Castles(queenSide = false)
          } else if (str == "q") {
            Castles(kingSide = true)
          } else {
            throw new Exception("Invalid Castles String")
          }
        }
        case str: String if str.length == 2 => Castles()
        case _ => throw new Exception("Invalid Castles String")
      })

    implicit val chessStateWrites: Writes[ChessState] = (
      (JsPath \ "playing").write[Boolean] and
        (JsPath \ "selected").writeOptionWithNull[Tile] and
        (JsPath \ "color").write[PieceColor] and
        (JsPath \ "whiteCastle").write[Castles] and
        (JsPath \ "blackCastle").write[Castles] and
        (JsPath \ "halfMoves").write[Int] and
        (JsPath \ "fullMoves").write[Int] and
        (JsPath \ "enPassant").writeOptionWithNull[Tile] and
        (JsPath \ "size").write[Int]
    )(s => (s.playing, s.selected, s.color, s.whiteCastle, s.blackCastle, s.halfMoves, s.fullMoves, s.enPassant, s.size))

    implicit val chessStateReads: Reads[ChessState] = (
      (JsPath \ "playing").read[Boolean] and
        (JsPath \ "selected").readNullable[Tile] and
        (JsPath \ "color").read[PieceColor] and
        (JsPath \ "whiteCastle").read[Castles] and
        (JsPath \ "blackCastle").read[Castles] and
        (JsPath \ "halfMoves").read[Int] and
        (JsPath \ "fullMoves").read[Int] and
        (JsPath \ "enPassant").readNullable[Tile] and
        (JsPath \ "size").read[Int]
    )((playing, selected, color, whiteCastle, blackCastle, halfMoves, fullMoves, enPassant, size) => ChessState(playing, selected, color, whiteCastle, blackCastle, halfMoves, fullMoves, enPassant, size))

    implicit val pieceMatrixFormat = new Format[Map[Tile, Piece]] {
      def reads(json: JsValue): JsResult[Map[Tile, Piece]] = json.validate[Map[String, Piece]].map(_.map({ case (tile, piece) => (Tile(tile), piece) }))
      def writes(matrix: Map[Tile, Piece]): JsValue = Json.toJson(matrix.map({ case (tile, piece) => (tile.toString, piece) }))
    }

    implicit val gameDataWrites: Writes[GameData] = (
      (JsPath \ "pieces").write[Map[Tile, Piece]] and
        (JsPath \ "state").write[ChessState] and
        (JsPath \ "check").write[Boolean] and
        (JsPath \ "gameState").write[String]
    )(unlift(GameData.unapply))

    implicit val moveDataWrites: Writes[MoveData] = (
      (JsPath \ "from").write[Tile] and
        (JsPath \ "to").write[Tile] and
        (JsPath \ "playerId").write[String]
    )(unlift(MoveData.unapply))

    implicit val moveDataReads: Reads[MoveData] = (
      (JsPath \ "from").read[Tile] and
        (JsPath \ "to").read[Tile] and
        (JsPath \ "playerId").read[String]
    )(MoveData.apply _)

    implicit val gameDataFormat = Json.format[GameData]
    implicit val moveDataFormat = Json.format[MoveData]
}