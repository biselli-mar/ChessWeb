package models.data

import de.htwg.se.chess.util.data.Tile

case class MoveData (
    from: Tile,
    to: Tile,
    playerId: String
)