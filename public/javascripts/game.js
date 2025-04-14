/* eslint-disable no-undef */
Vue.component('chess-modals', {
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

Vue.component('game-container', {
  data() {
    return {
      chessBoard: $('#chessboard'),
      selectHighlight: $('#select-highlight'),
      moveHighlightFrom: $('#move-highlight-from'),
      moveHighlightTo: $('#move-highlight-to'),
      checkHighlight: $('#check-highlight'),
      gameOverModal: $('#game-over-modal'),
      gameOverModalIcon: $('#game-over-modal-icon'),
      gameOverModalText: $('#game-over-modal-text'),
      gameOverModalTitle: $('#game-over-modal-title'),
      gameOverModalButton: $('#game-over-modal-button'),
      moveSound: $('#move-sound')[0],
      captureSound: $('#capture-sound')[0],
      checkSound: $('#check-sound')[0],
      fileChars: 'ABCDEFGH',
      position: {},
      legalMoves: {},
      animationDuration: 350,
      animateState: false,
      waitingTurn: true,
      socket: undefined,
      socketUrl: "ws://localhost:9000/play/socket?sessionId=" + this.getCookie('CHESS_SESSION_ID'),
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
      return '' + (fileChars.indexOf(tile[0]) + 1) + tile[1];
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
      const pieceDiv = document.createElement('div');
      tile = this.getColRow(tile);
      pieceDiv.classList.add('piece');
      pieceDiv.classList.add(piece);
      pieceDiv.classList.add('square-' + tile);
      pieceDiv.id = piece + '-' + tile;
      pieceDiv.draggable = true;
      return pieceDiv;
    },
    fillBoard() {
      if (this.varPlayerColor === 'b') {
        this.chessBoard.addClass('flipped');
      }
      for (const [tile, piece] of Object.entries(this.position)) {
        this.chessBoard.append(pieceDiv(piece, tile));
      }
  
      this.createCoordinateSvg(this.varPlayerColor === 'w');
  
      const pieces = $('.piece');
  
      pieces.on('mousedown', this.pieceMousedownHandler);
  
      pieces.each((index, piece) => {
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
          if (position["pieces"][tile] !== piece) {
              diff[tile] = piece;
          }
      }
      for (const [tile, piece] of Object.entries(position["pieces"])) {
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
      this.removeSquareClass(selectHighlight);
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
  created() {
    this.socket = new WebSocket(socketUrl);
    this.socket.onopen = function() {
        console.log("Socket to server opened");
    }
    this.socket.onmessage = function(event) {
        console.log("Socket received data: " + event.data)
        if (event.data === 'Wait for opponent') {
            console.log("Waiting for opponent; start keep alive");
            this.socket.send('Keep alive');
            setInterval(() => this.socket.send('Keep alive'), 20000);
        } else if (event.data === 'Keep alive') {
            console.log("Keep alive");
        } else {
            const data = JSON.parse(event.data);
            console.log("Received different data:" + data);
            if (data["error"] === undefined) {
                if (data["move"] !== undefined) {
                    console.log("Received move data: " + data);
                    processMove(data);
                } else {
                    console.log("Initializing board: " + data);
                    this.position = data;
                    console.log(data["pieces"]);
                    console.log(data["legal-moves"]);
                    console.log(data["player-color"]);
                    this.varPlayerColor = data["player-color"];
                    fillBoard(data["pieces"], data["player-color"]);
                    if (data["player-color"] === data["state"]["color"]) {
                        waitingTurn = false;
                        legalMoves = data["legal-moves"];
                    } else {
                        waitingTurn = true;
                        legalMoves = {};
                    }
                }
    
            } else {
                console.error("Socket sent error: " + data["error"]);
                alert(data["error"]);
            }
        }
    }
    socket.onerror = function(event) {
        console.error("Socket sent error");
        console.error(event.data);
    }
    socket.onclose = function() {
        console.log("Closing socket");
    }
    if (this.varPlayerColor === 'b') {
      $('chessboard').addClass('flipped');
    }
    this.moveSound.volume = 0.1;
    this.captureSound.volume = 0.1;
    this.checkSound.volume = 0.1;
    const sessionIdDisplay = $('#sessionIdDisplay');
    sessionIdDisplay.text("Session ID: " + getCookie('CHESS_SESSION_ID'));
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
