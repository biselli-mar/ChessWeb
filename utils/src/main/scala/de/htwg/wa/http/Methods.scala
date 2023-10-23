package de.htwg.wa
package http

enum HttpMethod(val name: String):
  case GET extends HttpMethod("GET")
  case POST extends HttpMethod("POST")
  case PUT extends HttpMethod("PUT")
  case DELETE extends HttpMethod("DELETE")
  case HEAD extends HttpMethod("HEAD")
  case OPTIONS extends HttpMethod("OPTIONS")
  case PATCH extends HttpMethod("PATCH")
  case TRACE extends HttpMethod("TRACE")

  override def toString(): String = name