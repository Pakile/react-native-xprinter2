import moment from 'moment';

type Order = any;

const order: Order = {
  restaurantName: "GOODBLEND",
  address: "Mizuki Park, Bình Chánh, TP Hồ Chí Minh",
  phone: "0933254206",
  billNumber: "400000864",
  table: "KV TRONG - 4",
  checkIn: moment().format("HH:mm DD/MM/YYYY"),
  printTime: moment().format("HH:mm"),
  cashier: "Thành Ngân 3",
  items: [
    {
      name: "Thanh Long Bowl",
      quantity: 1,
      price: 50000,
      note: "Topping: Chuối, Xoài",
    },
    {
      name: "Mango Bowl",
      quantity: 1,
      price: 50000,
      note: "Topping: Chuối, Xoài",
    },
    {
      name: "Dừa Xanh Bowl",
      quantity: 1,
      price: 50000,
      note: "Topping: Chuối, Xoài, Thanh Long",
    },
  ],
  total: 150000,
  paymentMethod: "Tiền mặt",
  staffCode: "1021399178 - VŨ THỊ THU THẢO",
};

export default order; 