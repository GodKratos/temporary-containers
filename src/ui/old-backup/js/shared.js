/**
 * Shared constants for the Temporary Containers UI
 */

// Import from the original shared.ts file
export const CONTAINER_COLORS = [
  'blue',
  'turquoise',
  'green',
  'yellow',
  'orange',
  'red',
  'pink',
  'purple',
  'toolbar',
];

export const CONTAINER_ICONS = [
  'fingerprint',
  'briefcase',
  'dollar',
  'cart',
  'circle',
  'gift',
  'vacation',
  'food',
  'fruit',
  'pet',
  'tree',
  'chill',
  'fence',  
];

export const TOOLBAR_ICON_COLORS = [
  'default',
  'black-simple',
  'blue-simple',
  'red-simple',
  'white-simple',
];

export const REDIRECTOR_DOMAINS_DEFAULT = [
  'accounts.google.com',
  'login.microsoftonline.com',
  'paypal.com',
  'login.live.com',
  'github.com',
  'gitlab.com',
  'login.yahoo.com',
  'amazon.com',
  'amazon.de',
  'amazon.co.uk',
  'ebay.com',
  'ebay.de',
  'ebay.co.uk',
  'facebook.com',
  'twitter.com',
];

export const CONTAINER_REMOVAL_DEFAULT = {
  900000: ['optionsGeneralContainerRemoval15Minutes', '15 minutes after the last tab in it closes (default)'],
  300000: ['optionsGeneralContainerRemoval5Minutes', '5 minutes after the last tab in it closes'],
  120000: ['optionsGeneralContainerRemoval2Minutes', '2 minutes after the last tab in it closes'],
  0: ['optionsGeneralContainerRemovalInstant', 'After the last tab in it closes']
};
