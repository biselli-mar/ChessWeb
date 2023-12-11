/* eslint-disable no-undef */
const app = Vue.createApp({})

app.config.compilerOptions.isCustomElement = tag => tag === 'chessboard'

app.component('nav-container', {
  data() {
    return {
      navItems: [
        {
          name: 'About',
          destUrl: '/about',
          iconClass: 'bi-info-square'
        },
        {
          name: "Profile",
          destUrl: "/profile",
          iconClass: "bi-person-square"
        }
      ],
      lightIcon: 'bi-brightness-high',
      darkIcon: 'bi-moon-stars',
      theme: 'light'
    }
  },
  methods: {
    setStoredTheme(theme) {
      localStorage.setItem('theme', theme)
    },
    getStoredTheme() {
      return localStorage.getItem('theme')
    },
    getPreferredTheme() {
      const storedTheme = this.getStoredTheme()
      if (storedTheme) {
        return storedTheme
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    },
    setTheme(theme) {
      if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-bs-theme', 'dark')
      } else {
        document.documentElement.setAttribute('data-bs-theme', theme)
      }
    },
    showActiveTheme(theme) {
      const themeSwitcher = document.querySelector('#color-mode-switch')
      const themeIcon = document.querySelector('#color-mode-icon')
      document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
        element.classList.remove('active')
        element.setAttribute('aria-pressed', 'false')
      })
      if (theme === 'dark') {
        // Set themeSwitcher checkbox to checked
        themeSwitcher.checked = true
        themeIcon.classList.remove(this.lightIcon)
        themeIcon.classList.add(this.darkIcon)
      } else {
        themeSwitcher.checked = false
        themeIcon.classList.remove(this.darkIcon)
        themeIcon.classList.add(this.lightIcon)
      }
    },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      this.setStoredTheme(this.theme)
      this.setTheme(this.theme)
      this.showActiveTheme(this.theme)
    }
  },
  mounted() {
    this.theme = this.getPreferredTheme()
    this.setTheme(this.theme)
    this.showActiveTheme(this.theme)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const storedTheme = this.getStoredTheme()
      if (storedTheme !== 'light' && storedTheme !== 'dark') {
        this.setTheme(this.theme)
      }
    })

    window.addEventListener('DOMContentLoaded', () => {
      this.showActiveTheme(this.theme)
    })
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.forEach(tooltipTriggerEl => {
      new bootstrap.Tooltip(tooltipTriggerEl)
    })
  },
  template: `
    <main>
      <nav class="navbar navbar-expand-sm flex-shrink-0" aria-label="navbar">
        <div class="container-fluid">
          <a class="navbar-brand" data-bs-toggle="tooltip" data-bs-placement="right" aria-label="Home" data-bs-original-title="Home" href="/">
            <img class="pe-none ms-2 ms-lg-0" src="/assets/images/logo.png">
            <div class="navbar-brand-icon"></div>
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav-pills" aria-controls="nav-pills" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="navbar-collapse collapse me-auto me-lg-0" id="nav-pills">
            <ul class="navbar-nav me-auto me-lg-0 w-100">
              <li v-for="item in navItems" class="nav-item ps-3 ps-sm-1 pe-1 ps-lg-2 pe-lg-0">
                <a class="nav-link border-bottom rounded-0 w-auto" data-bs-toggle="tooltip" data-bs-placement="right" v-bind:aria-label="item.name" v-bind:data-bs-original-title="item.name" :href="item.destUrl">
                  <i v-bind:class="'fs-4 me-1 bi pe-none ' + item.iconClass" v-bind:aria-label="item.name"></i>
                  <span class="fs-5 align-text-bottom nav-item-description">{{ item.name }}</span>
                </a>
              </li>
            </ul>
            <div class="d-flex flex-row" id="color-mode-selector">
              <i class="bi bi-moon-stars ps-2 pe-1" id="color-mode-icon"></i>
              <div class="form-check form-switch">
                <input @click="toggleTheme()" class="form-check-input color-switch" type="checkbox" role="switch" id="color-mode-switch">
              </div>
            </div>
          </div>
        </div>
      </nav>
      <slot></slot>
    </main>
  `
})

app.component('join-session', {
  data() {
    return {}
  },
  methods: {
    joinSession() {
      const sessionIdForm = $('#join-session-form');
      const csrfForm = $('#csrf-form');
      const sessionId = sessionIdForm.children('input[name="sessionId"]').val();
      console.log("Joining session: " + sessionId)
      const csrfToken = csrfForm.children('input[name="csrfToken"]').val()
      const formData = {
        csrfToken: csrfToken,
        sessionId: sessionId
      };
      $.ajax({
        type: 'POST',
        url: '/session/join',
        data: formData,
        success: function (data) {
          console.log(data);
          console.log(data.session);
          console.log("val CHESS_SESSION_ID=" + data.session);
          document.cookie = "CHESS_SESSION_ID=" + data.session + "; path=/";
          document.cookie = "CHESS_PLAYER_ID=" + data.player + "; path=/";
          window.location.href = "/play";
        },
        error: function (jqXHR, textStatus, errorThrown) {
          alert("Encountered error while trying to join a game\nError code: " + jqXHR + "\n" + errorThrown);
          return [];
        }
      });
    }
  },
  template: `
    <div class="button-container">
      <form id="join-session-form">
        <input class="form-control" id="sessionId" type="text" name="sessionId" value="" placeholder="Game-Code">
      </form>
      <button @click="joinSession()" class="btn btn-primary m-2" id="join-session-btn">Join</button>
    </div>
  `
});

app.component('create-session', {
  data() {
    return {}
  },
  methods: {
    createSession(asWhite) {
      const csrfToken = $('#csrf-form').children('input[name="csrfToken"]').val()
      const formData = {
        csrfToken: csrfToken,
        playWhite: asWhite
      };
      $.ajax({
        type: 'POST',
        url: '/session',
        data: formData,
        success: function (data) {
          console.log(data);
          console.log(data.session);
          console.log("val CHESS_SESSION_ID=" + data.session);
          document.cookie = "CHESS_SESSION_ID=" + data.session + "; path=/";
          document.cookie = "CHESS_PLAYER_ID=" + data.player + "; path=/";
          window.location.href = "/play";
        },
        error: function (jqXHR, textStatus, errorThrown) {
          alert("Encountered error while trying to create a game\nError code: " + textStatus + "\n" + errorThrown);
          return [];
        }
      });
    },
    joinWhite() {
      this.createSession(true)
    },
    joinBlack() {
      this.createSession(false)
    }
  },
  template: `
    <div class="button-container">
      <button @click="joinWhite()" class="chess-button chess-button-big" id="join-white-btn">Play as White</button>
      <button @click="joinBlack()" class="chess-button chess-button-big" id="join-black-btn">Play as Black</button>
    </div>
    `
});

app.component('chess-modals', {
  template: `
    <div class="modal fade" id="game-over-modal" tabindex="-1" role="dialog" aria-labelledby="game-over-modal-title" aria-hidden="true">
      <div class="modal-dialog modal-sm" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="game-over-modal-title"></h5>
            <button id="game-over-modal-button" type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body d-flex flex-row p-0 m-3">
            <div id="game-over-modal-icon"></div>
            <span class="ps-3" id="game-over-modal-text"></span>
          </div>
        </div>
      </div>
    </div>
  `
});

app.component('game-container', {
  data() {
    return {
      chessBoard: undefined,
      selectHighlight: undefined,
      moveHighlightFrom: undefined,
      moveHighlightTo: undefined,
      checkHighlight: undefined,
      gameOverModal: undefined,
      gameOverModalIcon: undefined,
      gameOverModalText: undefined,
      gameOverModalTitle: undefined,
      gameOverModalButton: undefined,
      moveSound: undefined,
      captureSound: undefined,
      checkSound: undefined,
      sessionIdDisplay: undefined,
      fileChars: 'ABCDEFGH',
      position: {},
      legalMoves: {},
      animationDuration: 350,
      animateState: false,
      waitingTurn: true,
      socket: undefined,
      socketUrl: "",
      varPlayerColor: this.playerColor
    }
  },
  props: {
    playerColor: {
      type: String,
      required: true
    }
  },
  methods: {
    getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    },
    getColRow(tile) {
      return '' + (this.fileChars.indexOf(tile[0]) + 1) + tile[1];
    },
    getTileTransformValues(tile, pieceWidth) {
      const colRow = this.getColRow(tile);
      
      if (this.varPlayerColor === 'w') {
          return {
              x: (colRow[0] - 1) * pieceWidth,
              y: (8 - colRow[1]) * pieceWidth
          }
      } else {
          return {
              x: (8 - colRow[0]) * pieceWidth,
              y: (colRow[1] - 1) * pieceWidth
          }
      
      }
    },
    removeSquareClass(div) {
      div[0].classList.forEach((className) => {
          if (className.startsWith('square-')) {
              div.removeClass(className);
          }
      });
    },
    pieceMousedownHandler(event) {
      if (this.waitingTurn) return;
      $('.hint').remove();
  
      const piece = event.target;
      piece.classList.forEach((className) => {
          if (className.startsWith('square-')) {
              const tile = this.fileChars[parseInt(className[7]) - 1] + className[8];
  
              this.removeSquareClass(this.selectHighlight);
              this.selectHighlight.addClass(className);
              this.selectHighlight.removeClass('visually-hidden');
  
              const moves = this.legalMoves[tile];
              if (moves === undefined) return;
              for (const move of moves) {
                this.chessBoard.append(this.hintDiv(move, tile));
              }
              return;
          }
      });
    },
    pieceDragstartHandler(event) {
      const piece = event.target;
      piece.classList.add('visually-hidden');
  
      const pieceImageSrc = window.getComputedStyle(piece).backgroundImage;
      const pieceWidth = piece.offsetWidth;
  
      const dragImage = document.createElement('img');
      dragImage.src = pieceImageSrc.substring(5, pieceImageSrc.length - 2); // remove `url("` and `")`
      dragImage.width = pieceWidth;
  
      event.dataTransfer.setDragImage(dragImage, pieceWidth, pieceWidth);
      event.dataTransfer.setData('text/plain', piece.id); // Send the piece id
    },
    addHintEventListeners(hint, srcTile, destTile) {
      hint.addEventListener('click', () => {
          animateState = true;
          this.socket.send(JSON.stringify({
              from: srcTile,
              to: destTile,
              playerId: this.getCookie('CHESS_PLAYER_ID')
          }));
      });
  
      hint.addEventListener('dragover', (event) => {
          hint.classList.add('hint-drop');
          event.preventDefault();
      });
  
      hint.addEventListener('dragleave', (event) => {
          hint.classList.remove('hint-drop');
          event.preventDefault();
      });
  
      hint.addEventListener('drop', (event) => {
          event.preventDefault();
          this.animateState = false;
          this.socket.send(JSON.stringify({
              from: srcTile,
              to: destTile,
              playerId: this.getCookie('CHESS_PLAYER_ID')
          }));
      });
    },
    hintDiv(destTile, srcTile) {
      const hint = document.createElement('div');
      hint.classList.add('hint');
      const squareNum = this.getColRow(destTile);
      if ($('.piece.square-' + squareNum)[0]) {
          hint.classList.add('hint-capture');
      } else {
          hint.classList.add('hint-move');
      }
      hint.classList.add('square-' + squareNum);
      
      this.addHintEventListeners(hint, srcTile, destTile);
  
      return hint;
    },
    pieceDiv(piece, tile) {
      console.log("pieceDiv: " + piece + " " + tile);
      const pieceDiv = document.createElement('div');
      tile = this.getColRow(tile);
      pieceDiv.classList.add('piece');
      pieceDiv.classList.add(piece);
      pieceDiv.classList.add('square-' + tile);
      pieceDiv.id = piece + '-' + tile;
      pieceDiv.draggable = true;
      return pieceDiv;
    },
    fillBoard(pieces, playerColor) {
      if (playerColor === 'b') {
        this.chessBoard.addClass('flipped');
      }
      for (const [tile, piece] of Object.entries(pieces)) {
        this.chessBoard.append(this.pieceDiv(piece, tile));
      }
  
      this.createCoordinateSvg(playerColor === 'w');
  
      const pieceDivs = $('.piece');
  
      pieceDivs.on('mousedown', this.pieceMousedownHandler);
  
      pieceDivs.each((index, piece) => {
          piece.addEventListener('dragstart', this.pieceDragstartHandler);
          piece.addEventListener('dragend', () => {
              piece.classList.remove('visually-hidden');
          });
      });
  
      this.chessBoard.removeClass('visually-hidden');
    },
    createCoordinateSvg(forWhite) {
      const svg = $('#chess-coordinates')[0];
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const fileSvg = (x, y, text, color) => {
          const fileText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          fileText.setAttribute('x', x + '%');
          fileText.setAttribute('y', y + '%');
          fileText.setAttribute('class', 'coordinates-' + color + ' file');
          fileText.textContent = text;
          svg.appendChild(fileText);
          //svg.append(`<text x="${x}%" y="${y}%" class="coordinates-${color} file">${text}</text>`);
      }
      const rankSvg = (x, y, text, color) => {
          const rankText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          rankText.setAttribute('x', x + '%');
          rankText.setAttribute('y', y + '%');
          rankText.setAttribute('class', 'coordinates-' + color + ' rank');
          rankText.textContent = text;
          svg.appendChild(rankText);
          //svg.append(`<text x="${x}%" y="${y}%" class="coordinates-${color} rank">${text}</text>`);
      }
      for(let i = 0; i < 8; i++) {
          let file = files[i];
          if (!forWhite) {
              file = files[7 - i];
          }
          let rank = 8 - i;
          if (!forWhite) {
              rank = i + 1;
          }
          let fileColor = 'light';
          let rankColor = 'dark';
          if (i % 2 == 0) {
              fileColor = 'dark';
              rankColor = 'light';
          }
  
          fileSvg(i * 12.5 + 10.8, 99, file.toString(), fileColor);
          rankSvg(0.75, i * 12.5 + 3.5, rank.toString(), rankColor);
      }
    },
    getPositionDiff(pieces) {
      const diff = {};
      for (const [tile, piece] of Object.entries(pieces)) {
          if (this.position["pieces"][tile] !== piece) {
              diff[tile] = piece;
          }
      }
      for (const [tile, piece] of Object.entries(this.position["pieces"])) {
          if (pieces[tile] !== piece) {
              diff[tile] = pieces[tile];
          }
      }
      return diff;
    },
    processMove(gameData) {
      const from = gameData["move"]["from"];
      const to = gameData["move"]["to"];
      $('.hint').remove();
      
      const colRowFrom = this.getColRow(from);
      const colRowTo = this.getColRow(to);
      let fromPiece = this.position["pieces"][from];
      this.selectHighlight.addClass('visually-hidden');
      this.removeSquareClass(this.selectHighlight);
      let fromPieceDiv = $('#' + fromPiece + '-' + colRowFrom);
      
      if (this.position["pieces"][from] !== gameData["pieces"][to]) { // promotion
          fromPieceDiv.removeClass(this.position["pieces"][from]);
          fromPieceDiv.addClass(gameData["pieces"][to]);
          fromPiece = gameData["pieces"][to];
      }
      if (this.animateState) {
          const pieceWidth = fromPieceDiv.width();
          const fromTransform = this.getTileTransformValues(from, pieceWidth);
          const toTransform = this.getTileTransformValues(to, pieceWidth);
          const toTransformDiff = {
              x: toTransform['x'] - fromTransform['x'],
              y: toTransform['y'] - fromTransform['y']
          }
  
          fromPieceDiv.animate(
          {
              left: '+=' + toTransformDiff['x'],
              top: '+=' + toTransformDiff['y']
          },
          {
              duration: this.animationDuration,
              start: () => {
                  fromPieceDiv.css('z-index', 100);
              },
              done: () => {
                  fromPieceDiv.addClass('square-' + colRowTo);
                  fromPieceDiv.removeClass('square-' + colRowFrom);
                  fromPieceDiv.attr('style', '');
                  fromPieceDiv.attr('id', fromPiece + '-' + colRowTo);
              }
          });
      }
      if($('.piece.square-' + this.getColRow(to))[0] !== undefined){
        this.captureSound.play();
      }
      else{
        this.moveSound.play();
      }     
      $('.piece.square-' + this.getColRow(to)).remove();
      const diff = this.getPositionDiff(gameData["pieces"]);
      for (const [tile, piece] of Object.entries(diff)) {
          if (tile !== from && piece === undefined) {
              $('.square-' + this.getColRow(tile)).remove('.piece');
          } else if (tile !== to && piece !== undefined) {
            this.chessBoard.append(this.pieceDiv(piece, tile));
          } else if (tile === to && !this.animateState) {
              fromPieceDiv.removeClass('square-' + colRowFrom);
              fromPieceDiv.addClass('square-' + colRowTo);
              fromPieceDiv.attr('id', fromPiece + '-' + colRowTo);
          }
      }
  
      const turnColor = gameData["state"]["color"];
      const kingDiv = $('.piece.'+turnColor+'k')[0];
  
      kingDiv.classList.forEach((className) => {
          if (className.startsWith('square-')) {
              if (gameData["check"]) {
                this.checkSound.play();
                this.removeSquareClass(this.checkHighlight);
                this.checkHighlight.removeClass('visually-hidden');
                this.checkHighlight.addClass(className);
              } else {
                this.checkHighlight.addClass('visually-hidden');
              }
          }
      });
  
      if (gameData["game-state"] == 'CHECKMATE') {
        this.gameOverModalTitle.text('Checkmate');
          const whiteWon = turnColor == 'b';
          this.gameOverModalIcon.addClass(whiteWon ? 'wk' : 'bk');
          this.gameOverModalText.text((whiteWon ? 'White' : 'Black') + ' wins!');
          this.gameOverModal.modal('toggle');
      } else if (gameData["game-state"] == 'DRAW') {
        this.gameOverModalTitle.text('Draw');
        this.gameOverModalText.text('The game ended in a draw');
        this.gameOverModal.modal('toggle');
      }
  
      this.position = gameData;
      if (this.animateState) {
        this.animateState = false;
      }
  
      if (this.varPlayerColor === turnColor) {
        this.legalMoves = gameData["legal-moves"];
        this.waitingTurn = false;
      } else {
        this.legalMoves = {};
        this.waitingTurn = true;
      }
  
      this.removeSquareClass(this.moveHighlightFrom);
      this.moveHighlightFrom.removeClass('visually-hidden');
      this.moveHighlightFrom.addClass('square-' + colRowFrom);
      this.removeSquareClass(this.moveHighlightTo);
      this.moveHighlightTo.removeClass('visually-hidden');
      this.moveHighlightTo.addClass('square-' + colRowTo);
    }
  },
  mounted() {
    this.chessBoard = $('#chessboard');
    this.selectHighlight = $('#select-highlight');
    this.moveHighlightFrom = $('#move-highlight-from');
    this.moveHighlightTo = $('#move-highlight-to');
    this.checkHighlight = $('#check-highlight');
    this.gameOverModal = $('#game-over-modal');
    this.gameOverModalIcon = $('#game-over-modal-icon');
    this.gameOverModalText = $('#game-over-modal-text');
    this.gameOverModalTitle = $('#game-over-modal-title');
    this.gameOverModalButton = $('#game-over-modal-button');
    this.moveSound = $('#move-sound')[0];
    this.captureSound = $('#capture-sound')[0];
    this.checkSound = $('#check-sound')[0];
    this.sessionIdDisplay = $('#sessionIdDisplay');

    this.socketUrl = "ws://localhost:9000/play/socket?sessionId=" + this.getCookie('CHESS_SESSION_ID');
    this.socket = new WebSocket(this.socketUrl);
    let _this = this;
    this.socket.onopen = function() {
        console.log("Socket to server opened");
    }
    this.socket.onmessage = function(event) {
        console.log("Socket received data: " + event.data)
        if (event.data === 'Wait for opponent') {
            console.log("Waiting for opponent; start keep alive");
            _this.socket.send('Keep alive');
            setInterval(() => _this.socket.send('Keep alive'), 20000);
        } else if (event.data === 'Keep alive') {
            console.log("Keep alive");
        } else {
            const data = JSON.parse(event.data);
            console.log("Received different data:" + data);
            if (data["error"] === undefined) {
                if (data["move"] !== undefined) {
                    console.log("Received move data: " + data);
                    _this.processMove(data);
                } else {
                    console.log("Initializing board: " + data);
                    _this.sessionIdDisplay.addClass('visually-hidden');
                    _this.position = data;
                    console.log(data["pieces"]);
                    console.log(data["legal-moves"]);
                    console.log(data["player-color"]);
                    _this.varPlayerColor = data["player-color"];
                    _this.fillBoard(data["pieces"], data["player-color"]);
                    if (data["player-color"] === data["state"]["color"]) {
                      _this.waitingTurn = false;
                      _this.legalMoves = data["legal-moves"];
                    } else {
                      _this.waitingTurn = true;
                      _this.legalMoves = {};
                    }
                }
    
            } else {
                console.error("Socket sent error: " + data["error"]);
                alert(data["error"]);
            }
        }
    }
    this.socket.onerror = function(event) {
        console.error("Socket sent error");
        console.error(event.data);
    }
    this.socket.onclose = function() {
        console.log("Closing socket");
    }
    if (this.varPlayerColor === 'b') {
      $('chessboard').addClass('flipped');
    }
    this.moveSound.volume = 0.1;
    this.captureSound.volume = 0.1;
    this.checkSound.volume = 0.1;
    this.sessionIdDisplay.text("Session ID: " + this.getCookie('CHESS_SESSION_ID'));
    this.gameOverModalButton.on('click', () => {
      this.gameOverModal.modal('toggle');
    });
  },
  template: `
    <div class="game-container" id="game">
      <div class="chess-layout">
        <div class="board-container">
          <chessboard id="chessboard" class="board visually-hidden">
            <svg class="coordinates" viewBox="0 0 100 100" id="chess-coordinates">
            </svg>
            <!--Highligh Squares-->
            <div class="highlight visually-hidden" id="select-highlight"></div>
            <div class="highlight visually-hidden" id="move-highlight-from"></div>
            <div class="highlight visually-hidden" id="move-highlight-to"></div>
            <div class="check visually-hidden" id="check-highlight"></div>
          </chessboard>
        </div>
      </div>
    </div>
  `
});

app.mount('#chess-web');