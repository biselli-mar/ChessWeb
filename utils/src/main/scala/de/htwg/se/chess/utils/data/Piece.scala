/*                                                                                      *\
**     _________  ______________________                                                **
**    /  ___/  / /  /  ____/  ___/  ___/        2023 Emanuel Kupke & Marcel Biselli     **
**   /  /  /  /_/  /  /__  \  \  \  \           https://github.com/emanuelk02/Chess     **
**  /  /__/  __   /  /___ __\  \__\  \                                                  **
**  \    /__/ /__/______/______/\    /         Software Engineering | HTWG Constance    **
**   \__/                        \__/                                                   **
**                                                                                      **
\*                                                                                      */


package de.htwg.se.chess
package util
package data


enum PieceType:
  case Rook, Queen, King, Pawn, Knight, Bishop

  override def toString: String = this match
    case Rook => "r"
    case Queen => "q"
    case King => "k"
    case Pawn => "p"
    case Knight => "n"
    case Bishop => "b"

enum PieceColor:
  case Black, White

  def toFenChar: String = this match
    case White => "w"
    case Black => "b"

extension (color: PieceColor)
    def invert: PieceColor = if color == PieceColor.White then PieceColor.Black else PieceColor.White

enum Piece(color: PieceColor, ptype: PieceType, name: String):
  case W_KING extends Piece(PieceColor.White, PieceType.King, "W_KING")
  case W_QUEEN extends Piece(PieceColor.White, PieceType.Queen, "W_QUEEN")
  case W_ROOK extends Piece(PieceColor.White, PieceType.Rook, "W_ROOK")
  case W_BISHOP extends Piece(PieceColor.White, PieceType.Bishop, "W_BISHOP")
  case W_KNIGHT extends Piece(PieceColor.White, PieceType.Knight, "W_KNIGHT")
  case W_PAWN extends Piece(PieceColor.White, PieceType.Pawn, "W_PAWN")
  case B_KING extends Piece(PieceColor.Black, PieceType.King, "B_KING")
  case B_QUEEN extends Piece(PieceColor.Black, PieceType.Queen, "B_QUEEN")
  case B_ROOK extends Piece(PieceColor.Black, PieceType.Rook, "B_ROOK")
  case B_BISHOP extends Piece(PieceColor.Black, PieceType.Bishop, "B_BISHOP")
  case B_KNIGHT extends Piece(PieceColor.Black, PieceType.Knight, "B_KNIGHT")
  case B_PAWN extends Piece(PieceColor.Black, PieceType.Pawn, "B_PAWN")

  def getColor: PieceColor = color
  def getType: PieceType = ptype

  override def toString: String = name
  def toHtmlString: String = this.color.toFenChar + this.toFenChar.toLowerCase()

  def toFenChar: String = this match
    case W_KING => "K"
    case W_QUEEN => "Q"
    case W_ROOK => "R"
    case W_BISHOP => "B"
    case W_KNIGHT => "N"
    case W_PAWN => "P"
    case B_KING => "k"
    case B_QUEEN => "q"
    case B_ROOK => "r"
    case B_BISHOP => "b"
    case B_KNIGHT => "n"
    case B_PAWN => "p"

object Piece:
  def apply(piece: String): Option[Piece] =
    piece.toUpperCase match
      case "W_KING" | "W_QUEEN" | "W_ROOK" | "W_BISHOP" | "W_KNIGHT" |
          "W_PAWN" | "B_KING" | "B_QUEEN" | "B_ROOK" | "B_BISHOP" | "B_KNIGHT" |
          "B_PAWN" =>
        Some(Piece.valueOf(piece.toUpperCase))
      case str: String if str.length == 1 =>
        Piece(str.toCharArray.head)
      case _ => None

  def apply(piece: Char): Option[Piece] =
    piece match
      case 'K' => Some(W_KING)
      case 'Q' => Some(W_QUEEN)
      case 'R' => Some(W_ROOK)
      case 'B' => Some(W_BISHOP)
      case 'N' => Some(W_KNIGHT)
      case 'P' => Some(W_PAWN)
      case 'k' => Some(B_KING)
      case 'q' => Some(B_QUEEN)
      case 'r' => Some(B_ROOK)
      case 'b' => Some(B_BISHOP)
      case 'n' => Some(B_KNIGHT)
      case 'p' => Some(B_PAWN)
      case _ => None
