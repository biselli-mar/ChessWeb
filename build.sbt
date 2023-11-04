import dependencies._

name := """chessweb"""

lazy val utils = project
    .in(file("./utils"))
    .settings(
        name := "utils",
        scalaVersion := scala3Version,
        libraryDependencies ++= Seq(
            scalaTest3
        ),
    )

lazy val root = project
    .in(file("."))
    .settings(
        scalaVersion := scala2Version,
        scalacOptions += "-Ytasty-reader",
        name := "chessWeb",
        libraryDependencies ++= Seq(
            guice,
            ws,
        ),
        libraryDependencies ++= commonDependency,
    )
    .dependsOn(utils)
    .enablePlugins(PlayScala, SbtWeb)
