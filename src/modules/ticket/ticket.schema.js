import Joi from "joi";

export const getTicketsSchema = Joi.object({
  page:     Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
});

export const getTicketDetailsSchema = Joi.object({
  ticketId: Joi.string().trim().required(),
});
