import { isArray, isNonArrayObject } from './utils';

import SerializerError from './serializerError';

class Serializer {
  constructor({ descriptor, defaultTransform = (key, value) => ({ [key]: value }), mapAllValues = false }) {
    this.descriptor = descriptor;
    this.mapAllValues = mapAllValues;
    this.defaultTransform = defaultTransform;
  }

  checkValidValue(field) {
    if (field === null || typeof field !== 'object' || Object.keys(field).length > 1) {
      throw new SerializerError(
        `Serializer mapper function values must return an non null object with only one key, instead found: ${field}`
      );
    }
  }

  getTransformedField(transform, key, value) {
    return transform(key, value);
  }

  transformWithFunction(object, transform, key, value) {
    const newField = this.getTransformedField(transform, key, value);
    this.checkValidValue(newField);
    return Object.assign({}, object, newField);
  }

  transformWithString(object, string, value) {
    object[string] = value;
  }

  serialize(element) {
    if (isArray(element)) {
      return element.map(innerElement => this.serialize(innerElement));
    }

    if (!isNonArrayObject(element)) {
      return element;
    }

    return Object.keys(element).reduce((accumulator, key) => {
      const value = element[key];
      const transform = this.descriptor && this.descriptor[key];

      // If no transform is given, it'll only return the key when this.mapAllValues = true
      if (transform === undefined) {
        if (this.mapAllValues) {
          return this.transformWithFunction(accumulator, this.defaultTransform, key, value);
        } else {
          return accumulator;
        }
      }

      if (typeof transform === 'function') {
        return this.transformWithFunction(accumulator, transform, key, value);
      } else if (typeof transform === 'string') {
        this.transformWithString(accumulator, transform, value);
      } else {
        throw new SerializerError(
          `Serializer mapper values must be either a string or a function, instead found: ${typeof transform}`
        );
      }

      return accumulator;
    }, {});
  }
}

export default Serializer;
