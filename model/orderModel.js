const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room', 
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  roomType: {
    type: String,
    required: true
  },
  adults: {
    type: Number,
    required: true
  },
  children: {
    type: Number,
    required: true
  },
  numberOfDays: {
    type: Number,
    required: true
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  totalAmounttoPay: {
    type: Number,
    required: true
  },
  city: {
    type: String,
    required: true
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
