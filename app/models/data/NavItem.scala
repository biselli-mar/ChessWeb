package models.data


case class NavItem(
    name: String,
    iconClass: String,
    destUrl: String,
)

object NavItem {
  val items = Seq(
    NavItem("Play", "bi-dpad", "/play"),
    NavItem("About", "bi-info-square", "/about"),
    NavItem("Profile", "bi-person-square", "/profile"),
  )
}