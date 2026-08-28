const Joi = require("joi");

const createAppointmentValidation =
  Joi.object({

    doctor:
      Joi.string().required(),

    hospital:
      Joi.string().required(),

    appointmentDate:
      Joi.date().required(),

    startTime:
      Joi.string().required(),

    endTime:
      Joi.string().required(),

    appointmentType:
      Joi.string()

      .valid(
        "physical",
        "video",
        "chat",
        "audio"
      )

      .required(),

    reason:
      Joi.string().optional(),

    patient:
      Joi.string().optional(),

    bookingMode:
      Joi.string()
        .valid("online", "walk-in")
        .optional(),
  });

const updateAppointmentStatusValidation =
  Joi.object({
    status:
      Joi.string()
        .valid(
          "pending",
          "confirmed",
          "completed",
          "cancelled"
        )
        .required(),
    cancellationReason:
      Joi.string().allow('', null).optional(),
  });

const rescheduleAppointmentValidation =
  Joi.object({
    appointmentDate:
      Joi.date().required(),
    startTime:
      Joi.string().required(),
    endTime:
      Joi.string().required(),
  });

const updatePaymentStatusValidation =
  Joi.object({
    status:
      Joi.string()
        .valid("pending", "paid")
        .required(),
    paymentMethod:
      Joi.string()
        .valid("cash", "online")
        .optional(),
    amount: Joi.number().optional(),
    transactionId: Joi.string().allow('', null).optional(),
    notes: Joi.string().allow('', null).optional()
  }).unknown(true);

module.exports = {
  createAppointmentValidation,
  updateAppointmentStatusValidation,
  rescheduleAppointmentValidation,
  updatePaymentStatusValidation,
};