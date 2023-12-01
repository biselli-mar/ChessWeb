package models.data

import akka.actor.ActorRef
import de.htwg.se.chess.util.data.PieceColor

case class SessionData(
    id: String,
    hostIsWhite: Boolean,
    actorRefs: Either[ActorRef, (ActorRef, ActorRef)]
) {
    def whiteActor: Option[ActorRef] = {
        if (hostIsWhite) {
            actorRefs match {
                case Left(host) => Some(host)
                case Right((host, guest)) => Some(host)
            }
        } else {
            actorRefs match {
                case Left(host) => None
                case Right((host, guest)) => Some(guest)
            }
        }
    }

    def blackActor: Option[ActorRef] = {
        if (hostIsWhite) {
            actorRefs match {
                case Left(host) => None
                case Right((host, guest)) => Some(guest)
            }
        } else {
            actorRefs match {
                case Left(host) => Some(host)
                case Right((host, guest)) => Some(host)
            }
        }
    }

    def guestColor: PieceColor = {
        if (hostIsWhite) {
            PieceColor.Black
        } else {
            PieceColor.White
        }
    }
}