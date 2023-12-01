/* eslint-disable no-undef */
"use strict";

const form = $('#join-session-form')

const joinBtn = $('#join-session-btn')
joinBtn .on('click', function (event) {
    event.preventDefault()
    joinSession($('#session-id').val())
})


function joinSession(sessionId) {
    const csrfToken = form.children('input[name="csrfToken"]').val()
    const formData = {
        csrfToken: csrfToken,
        sessionId: sessionId
    };
    $.ajax({
        type:'POST',
        url: '/session/join',
        data: formData,
        success: function(data) {
            console.log(data);
            setCookie("chess-session-id", sessionId);
            setCookie("chess-player-id", data["player"]);
            window.location.href = "/play";
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert("Encountered error while trying to create a game\nError code: " + textStatus + "\n" + errorThrown);
            return [];
        }
    });
}