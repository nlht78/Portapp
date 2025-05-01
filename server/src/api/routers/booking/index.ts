import { BookingController } from "@controllers/booking.controller";
import { authenticationV2 } from "@middlewares/authentication";
import { hasPermission } from "@middlewares/authorization";
import { Router } from "express";

const bookingRouter = Router();

bookingRouter.post("/", BookingController.createBooking);

bookingRouter.use(authenticationV2);

bookingRouter.get(
  "/",
  hasPermission("booking", "read"),
  BookingController.getBookings
);
bookingRouter.get(
  "/count",
  hasPermission("booking", "read"),
  BookingController.countUnseenBookings
);
bookingRouter.get(
  "/:bookingId",
  hasPermission("booking", "read"),
  BookingController.getBookingDetails
);

bookingRouter.put(
  "/:bookingId",
  hasPermission("booking", "update"),
  BookingController.updateBooking
);

module.exports = bookingRouter;
