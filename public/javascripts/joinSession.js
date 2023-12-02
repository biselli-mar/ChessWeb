/* eslint-disable no-undef */
"use strict";

const form = $('#join-session-form')

const joinBtn = $('#join-session-btn')
joinBtn .on('click', function (event) {
    event.preventDefault();
    const sessionId = form.children('input[name="sessionId"]').val();
    console.log("Session ID Input: " + sessionId);
    joinSession(sessionId);
})


function joinSession(sessionId) {
    console.log("Joining session: " + sessionId)
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
            console.log(data.session);
            console.log("val CHESS_SESSION_ID=" + data.session);
            document.cookie = "CHESS_SESSION_ID=" + data.session + "; path=/";
            document.cookie = "CHESS_PLAYER_ID=" + data.player + "; path=/";
            console.log("Session cookie:" + getCookie('CHESS_SESSION_ID'));
            window.location.href = "/play";
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert("Encountered error while trying to join a game\nError code: " + jqXHR + "\n" + errorThrown);
            return [];
        }
    });
}