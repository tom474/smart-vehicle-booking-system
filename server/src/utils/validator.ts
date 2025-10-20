import {
	registerDecorator,
	ValidationOptions,
	ValidationArguments,
	validateSync,
} from "class-validator";
import CreateLocationDto from "../dtos/location/create-location.dto";

export function IsAfter(
	compareWith: string | "now",
	validationOptions?: ValidationOptions,
) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			name: "isAfter",
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			constraints: [compareWith],
			validator: {
				validate(value: unknown, args: ValidationArguments): boolean {
					if (!value) return true;

					const [compareTo] = args.constraints;
					const currentValue = new Date(value as string);
					let targetValue: Date | null = null;

					if (compareTo === "now") {
						targetValue = new Date();
					} else {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const relatedValue = (args.object as any)[compareTo];
						if (!relatedValue) return true;
						targetValue = new Date(relatedValue);
					}

					return currentValue > targetValue;
				},

				defaultMessage(args: ValidationArguments): string {
					const [compareTo] = args.constraints;
					const readable =
						compareTo === "now" ? "the current time" : compareTo;
					return `${args.property} must be after ${readable}.`;
				},
			},
		});
	};
}

export function IsValidLocationInput(validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			name: "isValidLocationInput",
			target: object.constructor,
			propertyName,
			options: validationOptions,
			constraints: [],
			validator: {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				validate(value: unknown, _args: ValidationArguments): boolean {
					if (typeof value === "string") {
						return value.length >= 3 && value.length <= 255;
					}

					if (typeof value === "object" && value !== null) {
						const dto = Object.assign(
							new CreateLocationDto(),
							value,
						);
						const errors = validateSync(dto);
						return errors.length === 0;
					}

					return false;
				},

				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				defaultMessage(_args: ValidationArguments): string {
					return `Arrival location must be either a valid location ID or a valid location object.`;
				},
			},
		});
	};
}
