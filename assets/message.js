Game.Message = {
  _curMessage: '',
  renderOn: function(display) {
    display.clear();
    display.drawText(0,0,this._curMessage);
  },
  sendMessage: function(msg) {
    this._curMessage = msg;
    Game.renderMessage();
  },
  clearMessages: function() {
    this._curMessage = '';
  }
};
