/* eslint-disable no-prototype-builtins */
/* eslint-disable no-restricted-syntax */
function mapObjectToIpfsAttribute(obj: Record<any, any>) {
  const result = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result.push({
        display_type: typeof obj[key],
        trait_type: key,
        value: obj[key],
      });
    }
  }

  return result;
}

export { mapObjectToIpfsAttribute };
