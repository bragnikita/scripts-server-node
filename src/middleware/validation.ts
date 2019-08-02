import {Request} from "express";
import Joi from "@hapi/joi";

export const schemaValidate = (schema: Joi.ObjectSchema, req: Request) => {
    const { value, error } = schema.validate(req.body);
    if (error) {
        throw error;
    }
    return value;
};
export const schemaValidateJson = (schema: Joi.ObjectSchema, json: any) => {
    const { value, error } = schema.validate(json);
    if (error) {
        throw error;
    }
    return value;
};