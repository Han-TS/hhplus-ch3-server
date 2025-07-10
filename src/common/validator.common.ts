import { registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";

export function MaxByteLength(maxBytes: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "maxByteLength",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") return false;
          return Buffer.byteLength(value, "utf8") <= maxBytes;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be at most ${maxBytes} bytes (UTF-8)`;
        },
      },
    });
  };
}
