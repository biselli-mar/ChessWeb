ARG SCALA_VERSION=2.13.8
ARG SBT_VERSION=1.6.2
ARG JAVA_VERSION=11.0.14.1
ARG JDK_BASE=eclipse-temurin

#======================================================================================#
# SERVICE JAR ASSEMBLER
#======================================================================================#
FROM sbtscala/scala-sbt:${JDK_BASE}-${JAVA_VERSION}_${SBT_VERSION}_${SCALA_VERSION} as builder

EXPOSE 9000

# Copy project definition files
COPY project/dependencies.scala project/build.properties project/plugins.sbt project/
# Copy service source code dependencies
COPY ./ ./

# Build the project
ENTRYPOINT [ "sbt", "run" ]
