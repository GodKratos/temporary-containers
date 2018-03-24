const initialize = async () => {
  $('.menu .item').tab({
    history: true,
    historyType: 'hash'
  });
  $('.ui.dropdown').dropdown();
  $('.ui.checkbox').checkbox();
  try {
    const setCurrentPreferences = () => {
      document.querySelector('#automaticMode').checked = preferences.automaticMode.active;
      document.querySelector('#notificationsCheckbox').checked = preferences.notifications;
      document.querySelector('#containerNamePrefix').value = preferences.container.namePrefix;
      $('#containerColor').dropdown('set selected', preferences.container.color);
      document.querySelector('#containerColorRandom').checked = preferences.container.colorRandom;
      $('#containerIcon').dropdown('set selected', preferences.container.icon);
      document.querySelector('#containerIconRandom').checked = preferences.container.iconRandom;
      $('#containerNumberMode').dropdown('set selected', preferences.container.numberMode);
      $('#containerRemoval').dropdown('set selected', preferences.container.removal);
      $('#iconColor').dropdown('set selected', preferences.iconColor);

      $('#isolationGlobal').dropdown('set selected', preferences.isolation.global.navigation.action);
      $('#isolationMac').dropdown('set selected', preferences.isolation.mac.action);

      $('#isolationGlobalMouseClickMiddle').dropdown('set selected', preferences.isolation.global.mouseClick.middle.action);
      $('#isolationGlobalMouseClickCtrlLeft').dropdown('set selected', preferences.isolation.global.mouseClick.ctrlleft.action);
      $('#isolationGlobalMouseClickLeft').dropdown('set selected', preferences.isolation.global.mouseClick.left.action);

      $('#linkClickGlobalMiddleCreatesContainer').dropdown('set selected', preferences.isolation.global.mouseClick.middle.container);
      $('#linkClickGlobalCtrlLeftCreatesContainer').dropdown('set selected', preferences.isolation.global.mouseClick.ctrlleft.container);
      $('#linkClickGlobalLeftCreatesContainer').dropdown('set selected', preferences.isolation.global.mouseClick.left.container);

      $('#deletesHistoryContainer').dropdown('set selected', preferences.deletesHistory.automaticMode);
      document.querySelector('#deletesHistoryContextMenu').checked = preferences.deletesHistory.contextMenu;
      $('#deletesHistoryContainerRemoval').dropdown('set selected', preferences.deletesHistory.containerRemoval);
      $('#deletesHistoryContainerAlwaysPerWebsite').dropdown('set selected', preferences.deletesHistory.containerAlwaysPerWebsite);
      $('#deletesHistoryContainerIsolation').dropdown('set selected', preferences.deletesHistory.containerIsolation);
      $('#deletesHistoryContainerMouseClicks').dropdown('set selected', preferences.deletesHistory.containerMouseClicks);

      document.querySelector('#pageAction').checked = preferences.pageAction;
      document.querySelector('#contextMenu').checked = preferences.contextMenu;
      document.querySelector('#keyboardShortcutsAltC').checked = preferences.keyboardShortcuts.AltC;
      document.querySelector('#keyboardShortcutsAltP').checked = preferences.keyboardShortcuts.AltP;
      document.querySelector('#keyboardShortcutsAltN').checked = preferences.keyboardShortcuts.AltN;
      document.querySelector('#keyboardShortcutsAltShiftC').checked = preferences.keyboardShortcuts.AltShiftC;
      document.querySelector('#keyboardShortcutsAltX').checked = preferences.keyboardShortcuts.AltX;
      document.querySelector('#replaceTabs').checked = preferences.replaceTabs;
      document.querySelector('#ignoreRequestsToAMO').checked = preferences.ignoreRequestsToAMO;
      document.querySelector('#ignoreRequestsToPocket').checked = preferences.ignoreRequestsToPocket;
      $('#automaticModeNewTab').dropdown('set selected', preferences.automaticMode.newTab);

      document.querySelector('#statisticsCheckbox').checked = preferences.statistics;
      document.querySelector('#deletesHistoryStatisticsCheckbox').checked = preferences.deletesHistoryStatistics;

      updateIsolationDomains();
      updateSetCookiesDomainRules();
      updateStatistics();
      showDeletesHistoryStatistics();
    };

    const storage = await browser.storage.local.get('preferences');
    if (!storage.preferences || !Object.keys(storage.preferences).length) {
      showPreferencesError();
      return;
    }
    preferences = storage.preferences;
    setCurrentPreferences();

    $('#isolationDomainForm').form({
      fields: {
        isolationDomainPattern: 'empty'
      },
      onSuccess: (event) => {
        event.preventDefault();
        isolationDomainAddRule();
      }
    });

    $('#setCookiesDomainForm').form({
      fields: {
        setCookiesDomainPattern: 'empty',
        setCookiesDomainUrl: 'empty'
      },
      onSuccess: (event) => {
        event.preventDefault();
        setCookiesDomainAddRule();
      }
    });

    const domainPatternToolTip =
      '<div style="width:600px;">' +
      'Exact matches: e.g. <strong>example.com</strong> or <strong>www.example.com</strong><br>' +
      'Glob/Wildcard match: e.g. <strong>*.example.com</strong> (all example.com subdomains)<br>' +
      'Note: <strong>*.example.com</strong> would not match <strong>example.com</strong>, ' +
      'so you might need two rules. Website Rules overwrite Global Rules.</div>';

    $('#setCookiesDomainPatternDiv').popup({
      html: domainPatternToolTip,
      inline: true
    });

    $('#isolationDomainPattern').popup({
      html: domainPatternToolTip,
      inline: true
    });

    const automaticModeToolTip =
      '<div style="width:500px;">' +
      'Automatically reopen Tabs in new Temporary Containers when<ul>' +
      '<li> Opening a new Tab' +
      '<li> An external Program opens a Link in the Browser</ul></div>';

    $('#automaticModeField').popup({
      html: automaticModeToolTip,
      inline: true
    });

    const notificationsToolTip =
      '<div style="width:500px;">' +
      'Will ask for Notifications Permissions when you click the first time<br>' +
      'And with the next update of the Add-on - not again after that.<br>' +
      'Asking after update again is a Firefox bug and is already reported.</div>';

    $('#notificationsField').popup({
      html: notificationsToolTip,
      inline: true
    });

    const deletesHistoryStatisticsToolTip =
      '<div style="width:500px;">' +
      'The overall statistics include all Temporary Containers already<br>' +
      'This will show and collect separate statistics about how many "Deletes History<br>' +
      'Temporary Container" plus cookies and URLs with them got deleted.</div>';

    $('#deletesHistoryStatisticsField').popup({
      html: deletesHistoryStatisticsToolTip,
      inline: true
    });

    const historyPermission = await browser.permissions.contains({permissions: ['history']});
    if (historyPermission) {
      $('#deletesHistoryContainerWarningRead')
        .checkbox('check')
        .checkbox('set disabled');

      $('#keyboardShortcutsAltPField').removeClass('hidden');
    }

    const notificationsPermission = await browser.permissions.contains({permissions: ['notifications']});
    if (!notificationsPermission) {
      $('#notifications')
        .checkbox('uncheck');
    }

    if (!window.location.hash) {
      $('.menu .item').tab('change tab', 'general');
    }
  } catch (error) {
    showPreferencesError(error);
  }
};

document.addEventListener('DOMContentLoaded', initialize);
$('#saveContainerPreferences').on('click', saveContainerPreferences);
$('#saveAdvancedGeneralPreferences').on('click', saveAdvancedPreferences);
$('#saveAdvancedDeleteHistoryPreferences').on('click', saveAdvancedPreferences);
$('#saveIsolationGlobalPreferences').on('click', saveIsolationGlobalPreferences);
$('#saveIsolationMacPreferences').on('click', saveIsolationGlobalPreferences);
$('#saveStatisticsPreferences').on('click', saveStatisticsPreferences);
$('#resetStatistics').on('click', resetStatistics);
$('#deletesHistoryStatisticsField').on('click', showDeletesHistoryStatistics);
$('#deletesHistoryContainerWarningRead').on('click', requestHistoryPermissions);
$('#notifications').on('click', requestNotificationsPermissions);

$('#resetStorage').on('click', async (event) => {
  event.preventDefault();

  let reset = false;
  try {
    reset = await browser.runtime.sendMessage({
      method: 'resetStorage'
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[resetStorage] couldnt send message', error);
  }

  if (!reset) {
    $('#preferenceserrorcontent').html(`
      Now this is embarrassing. Storage reset didn't work either.
      At this point you probably have to reinstall the Add-on.
      Sorry again, but there's not much I can do about it since
      this is almost certainly a Firefox API problem right now.
    `);
  } else {
    initialize(event);
    $('#preferenceserror').modal('hide');
    showMessage('Storage successfully reset.', true);
  }
});