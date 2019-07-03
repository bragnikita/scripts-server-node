import {NextFunction} from "express";

export const aH = (fn: any, next: NextFunction) => {
    return async (...args: any) => {
        try {
            return await fn(...args)
        } catch (e) {
            next(e)
        }
    }
};