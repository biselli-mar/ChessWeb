package models.data

import de.htwg.se.chess.util.data._

case class GameData(
    pieces: Map[Tile, Piece],
    state: ChessState,
    check: Boolean,
    gameState: String
)