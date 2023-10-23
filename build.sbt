import dependencies._

name := """chessweb"""

lazy val utils = project
    .in(file("./utils"))
    .settings(
        name := "utils",
        scalaVersion := scala3Version,
        libraryDependencies += scalaTest3,
    )

lazy val root = project
    .in(file("."))
    .settings(
        scalaVersion := scala2Version,
        scalacOptions += "-Ytasty-reader",
        name := "chessWeb",
        libraryDependencies ++= Seq(
            guice,
            ws
        ),
        libraryDependencies ++= commonDependency,
    )
    .dependsOn(utils)
    .enablePlugins(PlayScala)

//libraryDependencies += "com.fasterxml.jackson.module" %% "jackson-module-scala" % "2.11.4"

// Adds additional packages into Twirl
//TwirlKeys.templateImports += "com.example.controllers._"

// Adds additional packages into conf/routes
// play.sbt.routes.RoutesKeys.routesImport += "com.example.binders._"
