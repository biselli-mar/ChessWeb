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
            console.log(data.session);
            console.log("val CHESS_SESSION_ID=" + data.session);
            document.cookie = "CHESS_SESSION_ID=" + data.session + "; path=/";
            document.cookie = "CHESS_PLAYER_ID=" + data.player + "; path=/";
            console.log("Session cookie:" + getCookie('CHESS_SESSION_ID'));
            window.location.href = "/play";
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert("Encountered error while trying to create a game\nError code: " + textStatus + "\n" + errorThrown);
            return [];
        }
    });
}

