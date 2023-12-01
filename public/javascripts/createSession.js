/* eslint-disable no-undef */
"use strict";

const joinWhiteBtn = $('#join-white-btn')
joinWhiteBtn .on('click', function (event) {
    event.preventDefault()
    createSession(true)
})

const joinBlackBtn = $('#join-black-btn')
joinBlackBtn.on('click', function (event) {
    event.preventDefault()
    createSession(false)
})

function createSession(asWhite) {
    let csrfToken;
    if (asWhite) {
        csrfToken = $('#join-white-form').children('input[name="csrfToken"]').val()
    } else {
        csrfToken = $('#join-black-form').children('input[name="csrfToken"]').val()
    }
    const formData = {
        csrfToken: csrfToken,
        playWhite: asWhite
    };
    $.ajax({
        type:'POST',
        url: '/session',
        data: formData,
        success: function(data) {
            console.log(data);
            setCookie("chess-session-id", data["session"]);
            setCookie("chess-player-id", data["player"]);
            window.location.href = "/play";
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert("Encountered error while trying to create a game\nError code: " + textStatus + "\n" + errorThrown);
            return [];
        }
    });
}

