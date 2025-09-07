// General page logic for options menu
import { getPreferences, savePreferences, showError, showSuccess } from '../../shared/utils';
import { PreferencesSchema } from '../../../types';

export async function initGeneralPage(): Promise<void> {
  try {
    const preferences = await getPreferences();
    const section = document.getElementById('general');
    if (!section) return;
    section.innerHTML = '';
    const content = document.createElement('div');
    content.className = 'form';
    content.innerHTML = `
      <div class="field checkbox-field">
        <input type="checkbox" id="automaticMode" name="automaticMode" />
        <label for="automaticMode" data-i18n="optionsGeneralAutomaticMode">Enable Automatic Mode</label>
      </div>
      <div class="field checkbox-field">
        <input type="checkbox" id="browserActionPopup" name="browserActionPopup" />
        <label for="browserActionPopup" data-i18n="optionsGeneralToolbarPopup">Show popup when clicking the toolbar icon</label>
      </div>
      <div class="field checkbox-field">
        <input type="checkbox" id="notificationsCheckbox" name="notifications" />
        <label for="notificationsCheckbox" data-i18n="optionsGeneralNotifications">Notifications when deleting Temporary Containers</label>
      </div>
      <div class="field">
        <label for="containerNamePrefix" data-i18n="optionsGeneralContainerNamePrefix">Container Name Prefix</label>
        <input type="text" id="containerNamePrefix" name="containerNamePrefix" />
      </div>
      <div class="field">
        <div class="checkbox-field">
          <input type="checkbox" id="containerColorRandom" name="containerColorRandom" />
          <label for="containerColorRandom" data-i18n="optionsGeneralContainerRandomColor">Random Container Color</label>
        </div>
        <div id="containerColorSection" class="sub-field">
          <label for="containerColor" data-i18n="optionsGeneralContainerColor">Container Color</label>
          <select id="containerColor" name="containerColor"></select>
        </div>
        <div id="containerColorRandomExcludedSection" class="sub-field hidden">
          <label for="containerColorRandomExcluded" data-i18n="optionsGeneralContainerColorRandomExcluded">Excluded Colors for Random Container Color</label>
          <div class="multi-select-container">
            <select id="containerColorRandomExcluded" name="containerColorRandomExcluded" multiple></select>
          </div>
        </div>
      </div>
      <div class="field">
        <div class="checkbox-field">
          <input type="checkbox" id="containerIconRandom" name="containerIconRandom" />
          <label for="containerIconRandom" data-i18n="optionsGeneralContainerIconRandom">Random Container Icon</label>
        </div>
        <div id="containerIconSection" class="sub-field">
          <label for="containerIcon" data-i18n="optionsGeneralContainerIcon">Container Icon</label>
          <select id="containerIcon" name="containerIcon"></select>
        </div>
        <div id="containerIconRandomExcludedSection" class="sub-field hidden">
          <label for="containerIconRandomExcluded" data-i18n="optionsGeneralContainerIconRandomExcluded">Excluded Icons for Random Container Icon</label>
          <div class="multi-select-container">
            <select id="containerIconRandomExcluded" name="containerIconRandomExcluded" multiple></select>
          </div>
        </div>
      </div>
      <div class="field">
        <label for="containerNumberMode" data-i18n="optionsGeneralContainerNumber">Container Number Mode</label>
        <select id="containerNumberMode" name="containerNumberMode">
          <option value="keep" data-i18n="optionsGeneralContainerNumberKeepCounting">Keep counting (default)</option>
          <option value="keepuntilrestart" data-i18n="optionsGeneralContainerNumberKeepCountingUntilRestart">Keep counting until browser restart</option>
          <option value="reuse" data-i18n="optionsGeneralContainerNumberReuseNumbers">Reuse available numbers</option>
          <option value="hide" data-i18n="optionsGeneralContainerNumberHide">Hide number</option>
        </select>
      </div>
      <div class="field">
        <label for="containerRemoval" data-i18n="optionsGeneralContainerRemoval">Delete no longer needed Temporary Containers</label>
        <select id="containerRemoval" name="containerRemoval"></select>
      </div>
      <div class="field">
        <label for="iconColor" data-i18n="optionsGeneralToolbarIconColor">Icon Color</label>
        <select id="iconColor" name="iconColor"></select>
      </div>
    `;
    section.appendChild(content);

    // Preference constants (should match those in options.js)
    const CONTAINER_COLORS = [
      'blue', 'turquoise', 'green', 'yellow', 'orange', 'red', 'pink', 'purple', 'toolbar', 'grey', 'white', 'black'
    ];
    const CONTAINER_ICONS = [
      'fingerprint', 'briefcase', 'dollar', 'cart', 'circle', 'gift', 'vacation', 'food', 'fruit', 'pet', 'tree', 'chill', 'fence', 'heart', 'star', 'lightbulb', 'cloud', 'umbrella', 'cup', 'flask', 'wine', 'music', 'camera', 'palette', 'book', 'puzzle', 'key', 'lock', 'moon', 'sun', 'eye', 'bolt', 'fire', 'leaf', 'snowflake', 'droplet', 'paw', 'rocket', 'plane', 'car', 'bicycle', 'bus', 'train', 'ship', 'subway', 'tram', 'taxi', 'truck', 'motorcycle', 'scooter', 'skateboard', 'roller-skate', 'wheelchair', 'baby', 'child', 'man', 'woman', 'family', 'group', 'user', 'users', 'person', 'people', 'smile', 'sad', 'angry', 'neutral', 'wink', 'laugh', 'cry', 'surprised', 'confused', 'tongue', 'kiss', 'love', 'star2', 'star3', 'star4', 'star5', 'star6', 'star7', 'star8', 'star9', 'star10', 'star11', 'star12', 'star13', 'star14', 'star15', 'star16', 'star17', 'star18', 'star19', 'star20', 'star21', 'star22', 'star23', 'star24', 'star25', 'star26', 'star27', 'star28', 'star29', 'star30', 'star31', 'star32', 'star33', 'star34', 'star35', 'star36', 'star37', 'star38', 'star39', 'star40', 'star41', 'star42', 'star43', 'star44', 'star45', 'star46', 'star47', 'star48', 'star49', 'star50', 'star51', 'star52', 'star53', 'star54', 'star55', 'star56', 'star57', 'star58', 'star59', 'star60', 'star61', 'star62', 'star63', 'star64', 'star65', 'star66', 'star67', 'star68', 'star69', 'star70', 'star71', 'star72', 'star73', 'star74', 'star75', 'star76', 'star77', 'star78', 'star79', 'star80', 'star81', 'star82', 'star83', 'star84', 'star85', 'star86', 'star87', 'star88', 'star89', 'star90', 'star91', 'star92', 'star93', 'star94', 'star95', 'star96', 'star97', 'star98', 'star99', 'star100', 'star101', 'star102', 'star103', 'star104', 'star105', 'star106', 'star107', 'star108', 'star109', 'star110', 'star111', 'star112', 'star113', 'star114', 'star115', 'star116', 'star117', 'star118', 'star119', 'star120', 'star121', 'star122', 'star123', 'star124', 'star125', 'star126', 'star127', 'star128', 'star129', 'star130', 'star131', 'star132', 'star133', 'star134', 'star135', 'star136', 'star137', 'star138', 'star139', 'star140', 'star141', 'star142', 'star143', 'star144', 'star145', 'star146', 'star147', 'star148', 'star149', 'star150', 'star151', 'star152', 'star153', 'star154', 'star155', 'star156', 'star157', 'star158', 'star159', 'star160', 'star161', 'star162', 'star163', 'star164', 'star165', 'star166', 'star167', 'star168', 'star169', 'star170', 'star171', 'star172', 'star173', 'star174', 'star175', 'star176', 'star177', 'star178', 'star179', 'star180', 'star181', 'star182', 'star183', 'star184', 'star185', 'star186', 'star187', 'star188', 'star189', 'star190', 'star191', 'star192', 'star193', 'star194', 'star195', 'star196', 'star197', 'star198', 'star199', 'star200', 'star201', 'star202', 'star203', 'star204', 'star205', 'star206', 'star207', 'star208', 'star209', 'star210', 'star211', 'star212', 'star213', 'star214', 'star215', 'star216', 'star217', 'star218', 'star219', 'star220', 'star221', 'star222', 'star223', 'star224', 'star225', 'star226', 'star227', 'star228', 'star229', 'star230', 'star231', 'star232', 'star233', 'star234', 'star235', 'star236', 'star237', 'star238', 'star239', 'star240', 'star241', 'star242', 'star243', 'star244', 'star245', 'star246', 'star247', 'star248', 'star249', 'star250', 'star251', 'star252', 'star253', 'star254', 'star255', 'star256', 'star257', 'star258', 'star259', 'star260', 'star261', 'star262', 'star263', 'star264', 'star265', 'star266', 'star267', 'star268', 'star269', 'star270', 'star271', 'star272', 'star273', 'star274', 'star275', 'star276', 'star277', 'star278', 'star279', 'star280', 'star281', 'star282', 'star283', 'star284', 'star285', 'star286', 'star287', 'star288', 'star289', 'star290', 'star291', 'star292', 'star293', 'star294', 'star295', 'star296', 'star297', 'star298', 'star299', 'star300', 'star301', 'star302', 'star303', 'star304', 'star305', 'star306', 'star307', 'star308', 'star309', 'star310', 'star311', 'star312', 'star313', 'star314', 'star315', 'star316', 'star317', 'star318', 'star319', 'star320', 'star321', 'star322', 'star323', 'star324', 'star325', 'star326', 'star327', 'star328', 'star329', 'star330', 'star331', 'star332', 'star333', 'star334', 'star335', 'star336', 'star337', 'star338', 'star339', 'star340', 'star341', 'star342', 'star343', 'star344', 'star345', 'star346', 'star347', 'star348', 'star349', 'star350', 'star351', 'star352', 'star353', 'star354', 'star355', 'star356', 'star357', 'star358', 'star359', 'star360', 'star361', 'star362', 'star363', 'star364', 'star365', 'star366', 'star367', 'star368', 'star369', 'star370', 'star371', 'star372', 'star373', 'star374', 'star375', 'star376', 'star377', 'star378', 'star379', 'star380', 'star381', 'star382', 'star383', 'star384', 'star385', 'star386', 'star387', 'star388', 'star389', 'star390', 'star391', 'star392', 'star393', 'star394', 'star395', 'star396', 'star397', 'star398', 'star399', 'star400', 'star401', 'star402', 'star403', 'star404', 'star405', 'star406', 'star407', 'star408', 'star409', 'star410', 'star411', 'star412', 'star413', 'star414', 'star415', 'star416', 'star417', 'star418', 'star419', 'star420', 'star421', 'star422', 'star423', 'star424', 'star425', 'star426', 'star427', 'star428', 'star429', 'star430', 'star431', 'star432', 'star433', 'star434', 'star435', 'star436', 'star437', 'star438', 'star439', 'star440', 'star441', 'star442', 'star443', 'star444', 'star445', 'star446', 'star447', 'star448', 'star449', 'star450', 'star451', 'star452', 'star453', 'star454', 'star455', 'star456', 'star457', 'star458', 'star459', 'star460', 'star461', 'star462', 'star463', 'star464', 'star465', 'star466', 'star467', 'star468', 'star469', 'star470', 'star471', 'star472', 'star473', 'star474', 'star475', 'star476', 'star477', 'star478', 'star479', 'star480', 'star481', 'star482', 'star483', 'star484', 'star485', 'star486', 'star487', 'star488', 'star489', 'star490', 'star491', 'star492', 'star493', 'star494', 'star495', 'star496', 'star497', 'star498', 'star499', 'star500', 'star501', 'star502', 'star503', 'star504', 'star505', 'star506', 'star507', 'star508', 'star509', 'star510', 'star511', 'star512', 'star513', 'star514', 'star515', 'star516', 'star517', 'star518', 'star519', 'star520', 'star521', 'star522', 'star523', 'star524', 'star525', 'star526', 'star527', 'star528', 'star529', 'star530', 'star531', 'star532', 'star533', 'star534', 'star535', 'star536', 'star537', 'star538', 'star539', 'star540', 'star541', 'star542', 'star543', 'star544', 'star545', 'star546', 'star547', 'star548', 'star549', 'star550', 'star551', 'star552', 'star553', 'star554', 'star555', 'star556', 'star557', 'star558', 'star559', 'star560', 'star561', 'star562', 'star563', 'star564', 'star565', 'star566', 'star567', 'star568', 'star569', 'star570', 'star571', 'star572', 'star573', 'star574', 'star575', 'star576', 'star577', 'star578', 'star579', 'star580', 'star581', 'star582', 'star583', 'star584', 'star585', 'star586', 'star587', 'star588', 'star589', 'star590', 'star591', 'star592', 'star593', 'star594', 'star595', 'star596', 'star597', 'star598', 'star599', 'star600', 'star601', 'star602', 'star603', 'star604', 'star605', 'star606', 'star607', 'star608', 'star609', 'star610', 'star611', 'star612', 'star613', 'star614', 'star615', 'star616', 'star617', 'star618', 'star619', 'star620', 'star621', 'star622', 'star623', 'star624', 'star625', 'star626', 'star627', 'star628', 'star629', 'star630', 'star631', 'star632', 'star633', 'star634', 'star635', 'star636', 'star637', 'star638', 'star639', 'star640', 'star641', 'star642', 'star643', 'star644', 'star645', 'star646', 'star647', 'star648', 'star649', 'star650', 'star651', 'star652', 'star653', 'star654', 'star655', 'star656', 'star657', 'star658', 'star659', 'star660', 'star661', 'star662', 'star663', 'star664', 'star665', 'star666', 'star667', 'star668', 'star669', 'star670', 'star671', 'star672', 'star673', 'star674', 'star675', 'star676', 'star677', 'star678', 'star679', 'star680', 'star681', 'star682', 'star683', 'star684', 'star685', 'star686', 'star687', 'star688', 'star689', 'star690', 'star691', 'star692', 'star693', 'star694', 'star695', 'star696', 'star697', 'star698', 'star699', 'star700', 'star701', 'star702', 'star703', 'star704', 'star705', 'star706', 'star707', 'star708', 'star709', 'star710', 'star711', 'star712', 'star713', 'star714', 'star715', 'star716', 'star717', 'star718', 'star719', 'star720', 'star721', 'star722', 'star723', 'star724', 'star725', 'star726', 'star727', 'star728', 'star729', 'star730', 'star731', 'star732', 'star733', 'star734', 'star735', 'star736', 'star737', 'star738', 'star739', 'star740', 'star741', 'star742', 'star743', 'star744', 'star745', 'star746', 'star747', 'star748', 'star749', 'star750', 'star751', 'star752', 'star753', 'star754', 'star755', 'star756', 'star757', 'star758', 'star759', 'star760', 'star761', 'star762', 'star763', 'star764', 'star765', 'star766', 'star767', 'star768', 'star769', 'star770', 'star771', 'star772', 'star773', 'star774', 'star775', 'star776', 'star777', 'star778', 'star779', 'star780', 'star781', 'star782', 'star783', 'star784', 'star785', 'star786', 'star787', 'star788', 'star789', 'star790', 'star791', 'star792', 'star793', 'star794', 'star795', 'star796', 'star797', 'star798', 'star799', 'star800', 'star801', 'star802', 'star803', 'star804', 'star805', 'star806', 'star807', 'star808', 'star809', 'star810', 'star811', 'star812', 'star813', 'star814', 'star815', 'star816', 'star817', 'star818', 'star819', 'star820', 'star821', 'star822', 'star823', 'star824', 'star825', 'star826', 'star827', 'star828', 'star829', 'star830', 'star831', 'star832', 'star833', 'star834', 'star835', 'star836', 'star837', 'star838', 'star839', 'star840', 'star841', 'star842', 'star843', 'star844', 'star845', 'star846', 'star847', 'star848', 'star849', 'star850', 'star851', 'star852', 'star853', 'star854', 'star855', 'star856', 'star857', 'star858', 'star859', 'star860', 'star861', 'star862', 'star863', 'star864', 'star865', 'star866', 'star867', 'star868', 'star869', 'star870', 'star871', 'star872', 'star873', 'star874', 'star875', 'star876', 'star877', 'star878', 'star879', 'star880', 'star881', 'star882', 'star883', 'star884', 'star885', 'star886', 'star887', 'star888', 'star889', 'star890', 'star891', 'star892', 'star893', 'star894', 'star895', 'star896', 'star897', 'star898', 'star899', 'star900', 'star901', 'star902', 'star903', 'star904', 'star905', 'star906', 'star907', 'star908', 'star909', 'star910', 'star911', 'star912', 'star913', 'star914', 'star915', 'star916', 'star917', 'star918', 'star919', 'star920', 'star921', 'star922', 'star923', 'star924', 'star925', 'star926', 'star927', 'star928', 'star929', 'star930', 'star931', 'star932', 'star933', 'star934', 'star935', 'star936', 'star937', 'star938', 'star939', 'star940', 'star941', 'star942', 'star943', 'star944', 'star945', 'star946', 'star947', 'star948', 'star949', 'star950', 'star951', 'star952', 'star953', 'star954', 'star955', 'star956', 'star957', 'star958', 'star959', 'star960', 'star961', 'star962', 'star963', 'star964', 'star965', 'star966', 'star967', 'star968', 'star969', 'star970', 'star971', 'star972', 'star973', 'star974', 'star975', 'star976', 'star977', 'star978', 'star979', 'star980', 'star981', 'star982', 'star983', 'star984', 'star985', 'star986', 'star987', 'star988', 'star989', 'star990', 'star991', 'star992', 'star993', 'star994', 'star995', 'star996', 'star997', 'star998', 'star999', 'star1000'
    ];
    const TOOLBAR_ICON_COLORS = ['default', 'blue', 'turquoise', 'green', 'yellow', 'orange', 'red', 'pink', 'purple', 'grey', 'white', 'black'];
    const CONTAINER_REMOVAL_DEFAULT: Record<string, [string, string]> = {
      '900000': ['optionsGeneralContainerRemovalAfter15min', 'After 15 minutes'],
      '1800000': ['optionsGeneralContainerRemovalAfter30min', 'After 30 minutes'],
      '3600000': ['optionsGeneralContainerRemovalAfter1h', 'After 1 hour'],
      '0': ['optionsGeneralContainerRemovalNever', 'Never']
    };

    // Helper to capitalize
    function capitalize(str: string) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Set initial values from preferences
    (document.getElementById('automaticMode') as HTMLInputElement).checked = preferences.automaticMode?.active || false;
    (document.getElementById('browserActionPopup') as HTMLInputElement).checked = preferences.browserActionPopup || false;
    (document.getElementById('notificationsCheckbox') as HTMLInputElement).checked = preferences.notifications || false;
    (document.getElementById('containerNamePrefix') as HTMLInputElement).value = preferences.container?.namePrefix || 'tmp';
    (document.getElementById('containerColorRandom') as HTMLInputElement).checked = preferences.container?.colorRandom || false;
    (document.getElementById('containerIconRandom') as HTMLInputElement).checked = preferences.container?.iconRandom || false;
    (document.getElementById('containerNumberMode') as HTMLSelectElement).value = preferences.container?.numberMode || 'keep';

    // Populate container colors
    const colorSelect = document.getElementById('containerColor') as HTMLSelectElement;
    colorSelect.innerHTML = '';
    CONTAINER_COLORS.forEach(color => {
      const option = document.createElement('option');
      option.value = color;
      option.textContent = capitalize(color);
      colorSelect.appendChild(option);
    });
    colorSelect.value = preferences.container?.color || CONTAINER_COLORS[8];

    // Populate container icons
    const iconSelect = document.getElementById('containerIcon') as HTMLSelectElement;
    iconSelect.innerHTML = '';
    CONTAINER_ICONS.forEach(icon => {
      const option = document.createElement('option');
      option.value = icon;
      option.textContent = capitalize(icon);
      iconSelect.appendChild(option);
    });
    iconSelect.value = preferences.container?.icon || CONTAINER_ICONS[4];

    // Populate toolbar icon colors
    const toolbarIconColorSelect = document.getElementById('iconColor') as HTMLSelectElement;
    toolbarIconColorSelect.innerHTML = '';
    TOOLBAR_ICON_COLORS.forEach(color => {
      const option = document.createElement('option');
      option.value = color;
      option.textContent = capitalize(color.replace('-', ' '));
      toolbarIconColorSelect.appendChild(option);
    });
    toolbarIconColorSelect.value = preferences.iconColor || TOOLBAR_ICON_COLORS[0];

    // Populate container removal options
    const removalSelect = document.getElementById('containerRemoval') as HTMLSelectElement;
    removalSelect.innerHTML = '';
    Object.entries(CONTAINER_REMOVAL_DEFAULT).forEach(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.setAttribute('data-i18n', text[0]);
      option.textContent = text[1];
      removalSelect.appendChild(option);
    });
    removalSelect.value = (preferences.container?.removal !== undefined ? preferences.container.removal.toString() : '900000');

    // Populate multi-selects for random excluded
    const colorRandomExcluded = document.getElementById('containerColorRandomExcluded') as HTMLSelectElement;
    colorRandomExcluded.innerHTML = '';
    CONTAINER_COLORS.forEach(color => {
      const option = document.createElement('option');
      option.value = color;
      option.textContent = capitalize(color);
      colorRandomExcluded.appendChild(option);
    });
    if (preferences.container?.colorRandomExcluded) {
      Array.from(colorRandomExcluded.options).forEach(option => {
        if (preferences.container.colorRandomExcluded.includes(option.value)) {
          option.selected = true;
        }
      });
    }

    const iconRandomExcluded = document.getElementById('containerIconRandomExcluded') as HTMLSelectElement;
    iconRandomExcluded.innerHTML = '';
    CONTAINER_ICONS.forEach(icon => {
      const option = document.createElement('option');
      option.value = icon;
      option.textContent = capitalize(icon);
      iconRandomExcluded.appendChild(option);
    });
    if (preferences.container?.iconRandomExcluded) {
      Array.from(iconRandomExcluded.options).forEach(option => {
        if (preferences.container.iconRandomExcluded.includes(option.value)) {
          option.selected = true;
        }
      });
    }

    // Show/hide random excluded sections
    function toggleRandomExcludedSections() {
      const colorRandom = (document.getElementById('containerColorRandom') as HTMLInputElement).checked;
      const colorSection = document.getElementById('containerColorSection');
      const colorExcludedSection = document.getElementById('containerColorRandomExcludedSection');
      if (colorRandom) {
        colorSection?.classList.add('hidden');
        colorExcludedSection?.classList.remove('hidden');
      } else {
        colorSection?.classList.remove('hidden');
        colorExcludedSection?.classList.add('hidden');
      }
      const iconRandom = (document.getElementById('containerIconRandom') as HTMLInputElement).checked;
      const iconSection = document.getElementById('containerIconSection');
      const iconExcludedSection = document.getElementById('containerIconRandomExcludedSection');
      if (iconRandom) {
        iconSection?.classList.add('hidden');
        iconExcludedSection?.classList.remove('hidden');
      } else {
        iconSection?.classList.remove('hidden');
        iconExcludedSection?.classList.add('hidden');
      }
    }
    toggleRandomExcludedSections();

    // Save helpers
    function savePref(path: string, value: any) {
      // Deep set utility
      const keys = path.split('.');
      let obj: any = preferences;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      savePreferences(preferences).then(() => showSuccess('Saved')).catch(() => showError('Failed to save'));
    }

    // Event listeners for all fields
    (document.getElementById('automaticMode') as HTMLInputElement).addEventListener('change', e => {
      savePref('automaticMode.active', (e.target as HTMLInputElement).checked);
    });
    (document.getElementById('browserActionPopup') as HTMLInputElement).addEventListener('change', e => {
      savePref('browserActionPopup', (e.target as HTMLInputElement).checked);
    });
    (document.getElementById('notificationsCheckbox') as HTMLInputElement).addEventListener('change', e => {
      savePref('notifications', (e.target as HTMLInputElement).checked);
    });
    (document.getElementById('containerNamePrefix') as HTMLInputElement).addEventListener('change', e => {
      savePref('container.namePrefix', (e.target as HTMLInputElement).value);
    });
    (document.getElementById('containerColorRandom') as HTMLInputElement).addEventListener('change', e => {
      savePref('container.colorRandom', (e.target as HTMLInputElement).checked);
      toggleRandomExcludedSections();
    });
    (document.getElementById('containerColor') as HTMLSelectElement).addEventListener('change', e => {
      savePref('container.color', (e.target as HTMLSelectElement).value);
    });
    (document.getElementById('containerColorRandomExcluded') as HTMLSelectElement).addEventListener('change', e => {
      const selected = Array.from((e.target as HTMLSelectElement).selectedOptions).map(o => o.value);
      savePref('container.colorRandomExcluded', selected);
    });
    (document.getElementById('containerIconRandom') as HTMLInputElement).addEventListener('change', e => {
      savePref('container.iconRandom', (e.target as HTMLInputElement).checked);
      toggleRandomExcludedSections();
    });
    (document.getElementById('containerIcon') as HTMLSelectElement).addEventListener('change', e => {
      savePref('container.icon', (e.target as HTMLSelectElement).value);
    });
    (document.getElementById('containerIconRandomExcluded') as HTMLSelectElement).addEventListener('change', e => {
      const selected = Array.from((e.target as HTMLSelectElement).selectedOptions).map(o => o.value);
      savePref('container.iconRandomExcluded', selected);
    });
    (document.getElementById('containerNumberMode') as HTMLSelectElement).addEventListener('change', e => {
      savePref('container.numberMode', (e.target as HTMLSelectElement).value);
    });
    (document.getElementById('containerRemoval') as HTMLSelectElement).addEventListener('change', e => {
      savePref('container.removal', (e.target as HTMLSelectElement).value);
    });
    (document.getElementById('iconColor') as HTMLSelectElement).addEventListener('change', e => {
      savePref('iconColor', (e.target as HTMLSelectElement).value);
    });

  } catch (error) {
    showError('Failed to load General settings');
  }
}
