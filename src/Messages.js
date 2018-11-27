class Messages
{
  get app_name() {
    return chrome.i18n.getMessage('app_name', []);
  }
  get app_name_short() {
    return chrome.i18n.getMessage('app_name_short', []);
  }
  get app_desc() {
    return chrome.i18n.getMessage('app_desc', []);
  }
  get chrome_web_store_description() {
    return chrome.i18n.getMessage('chrome_web_store_description', []);
  }
  get pomodoro_assistant() {
    return chrome.i18n.getMessage('pomodoro_assistant', []);
  }
  get start_pomodoro_cycle() {
    return chrome.i18n.getMessage('start_pomodoro_cycle', []);
  }
  get restart_pomodoro_cycle() {
    return chrome.i18n.getMessage('restart_pomodoro_cycle', []);
  }
  get restart_timer() {
    return chrome.i18n.getMessage('restart_timer', []);
  }
  get start_focusing() {
    return chrome.i18n.getMessage('start_focusing', []);
  }
  get start_short_break() {
    return chrome.i18n.getMessage('start_short_break', []);
  }
  get start_break() {
    return chrome.i18n.getMessage('start_break', []);
  }
  get start_long_break() {
    return chrome.i18n.getMessage('start_long_break', []);
  }
  get stop_timer() {
    return chrome.i18n.getMessage('stop_timer', []);
  }
  get pause_timer() {
    return chrome.i18n.getMessage('pause_timer', []);
  }
  get resume_timer() {
    return chrome.i18n.getMessage('resume_timer', []);
  }
  get pomodoro_history() {
    return chrome.i18n.getMessage('pomodoro_history', []);
  }
  get timer_paused() {
    return chrome.i18n.getMessage('timer_paused', []);
  }
  get pomodoro_count_zero() {
    return chrome.i18n.getMessage('pomodoro_count_zero', []);
  }
  get pomodoro_count_one() {
    return chrome.i18n.getMessage('pomodoro_count_one', []);
  }
  pomodoro_count_many(count) {
    return chrome.i18n.getMessage('pomodoro_count_many', [count]);
  }
  get marinara_pomodoro_assistant() {
    return chrome.i18n.getMessage('marinara_pomodoro_assistant', []);
  }
  get settings() {
    return chrome.i18n.getMessage('settings', []);
  }
  get history() {
    return chrome.i18n.getMessage('history', []);
  }
  get feedback() {
    return chrome.i18n.getMessage('feedback', []);
  }
  get focus_title() {
    return chrome.i18n.getMessage('focus_title', []);
  }
  get short_break_title() {
    return chrome.i18n.getMessage('short_break_title', []);
  }
  get long_break_title() {
    return chrome.i18n.getMessage('long_break_title', []);
  }
  get autostart_title() {
    return chrome.i18n.getMessage('autostart_title', []);
  }
  get autostart_description() {
    return chrome.i18n.getMessage('autostart_description', []);
  }
  get autostart_notification_title() {
    return chrome.i18n.getMessage('autostart_notification_title', []);
  }
  get autostart_notification_message() {
    return chrome.i18n.getMessage('autostart_notification_message', []);
  }
  get invalid_autostart_time() {
    return chrome.i18n.getMessage('invalid_autostart_time', []);
  }
  get time() {
    return chrome.i18n.getMessage('time', []);
  }
  get duration() {
    return chrome.i18n.getMessage('duration', []);
  }
  get invalid_duration() {
    return chrome.i18n.getMessage('invalid_duration', []);
  }
  get minutes() {
    return chrome.i18n.getMessage('minutes', []);
  }
  get timer_sound_label() {
    return chrome.i18n.getMessage('timer_sound_label', []);
  }
  get hover_preview() {
    return chrome.i18n.getMessage('hover_preview', []);
  }
  get speed_label() {
    return chrome.i18n.getMessage('speed_label', []);
  }
  get bpm() {
    return chrome.i18n.getMessage('bpm', []);
  }
  get invalid_bpm() {
    return chrome.i18n.getMessage('invalid_bpm', []);
  }
  get none() {
    return chrome.i18n.getMessage('none', []);
  }
  get when_complete() {
    return chrome.i18n.getMessage('when_complete', []);
  }
  get show_desktop_notification() {
    return chrome.i18n.getMessage('show_desktop_notification', []);
  }
  get show_new_tab_notification() {
    return chrome.i18n.getMessage('show_new_tab_notification', []);
  }
  get play_audio_notification() {
    return chrome.i18n.getMessage('play_audio_notification', []);
  }
  get take_a_long_break_setting() {
    return chrome.i18n.getMessage('take_a_long_break_setting', []);
  }
  get never() {
    return chrome.i18n.getMessage('never', []);
  }
  get every_2nd_break() {
    return chrome.i18n.getMessage('every_2nd_break', []);
  }
  get every_3rd_break() {
    return chrome.i18n.getMessage('every_3rd_break', []);
  }
  get every_4th_break() {
    return chrome.i18n.getMessage('every_4th_break', []);
  }
  get every_5th_break() {
    return chrome.i18n.getMessage('every_5th_break', []);
  }
  get every_6th_break() {
    return chrome.i18n.getMessage('every_6th_break', []);
  }
  get every_7th_break() {
    return chrome.i18n.getMessage('every_7th_break', []);
  }
  get every_8th_break() {
    return chrome.i18n.getMessage('every_8th_break', []);
  }
  get every_9th_break() {
    return chrome.i18n.getMessage('every_9th_break', []);
  }
  get every_10th_break() {
    return chrome.i18n.getMessage('every_10th_break', []);
  }
  get tone() {
    return chrome.i18n.getMessage('tone', []);
  }
  get electronic_chime() {
    return chrome.i18n.getMessage('electronic_chime', []);
  }
  get today() {
    return chrome.i18n.getMessage('today', []);
  }
  get this_week() {
    return chrome.i18n.getMessage('this_week', []);
  }
  get this_month() {
    return chrome.i18n.getMessage('this_month', []);
  }
  get total() {
    return chrome.i18n.getMessage('total', []);
  }
  average_stat(average) {
    return chrome.i18n.getMessage('average_stat', [average]);
  }
  get daily_distribution() {
    return chrome.i18n.getMessage('daily_distribution', []);
  }
  get weekly_distribution() {
    return chrome.i18n.getMessage('weekly_distribution', []);
  }
  last_9_months(count) {
    return chrome.i18n.getMessage('last_9_months', [count]);
  }
  get daily_empty_placeholder() {
    return chrome.i18n.getMessage('daily_empty_placeholder', []);
  }
  get weekly_empty_placeholder() {
    return chrome.i18n.getMessage('weekly_empty_placeholder', []);
  }
  get history_empty_placeholder() {
    return chrome.i18n.getMessage('history_empty_placeholder', []);
  }
  daily_tooltip(pomodoros, start, end) {
    return chrome.i18n.getMessage('daily_tooltip', [pomodoros, start, end]);
  }
  weekly_tooltip(pomodoros, day) {
    return chrome.i18n.getMessage('weekly_tooltip', [pomodoros, day]);
  }
  heatmap_tooltip(pomodoros, date) {
    return chrome.i18n.getMessage('heatmap_tooltip', [pomodoros, date]);
  }
  get decimal_separator() {
    return chrome.i18n.getMessage('decimal_separator', []);
  }
  get thousands_separator() {
    return chrome.i18n.getMessage('thousands_separator', []);
  }
  get heatmap_date_format() {
    return chrome.i18n.getMessage('heatmap_date_format', []);
  }
  get hour_format() {
    return chrome.i18n.getMessage('hour_format', []);
  }
  get hour_minute_format() {
    return chrome.i18n.getMessage('hour_minute_format', []);
  }
  get date_format() {
    return chrome.i18n.getMessage('date_format', []);
  }
  get date_time_format() {
    return chrome.i18n.getMessage('date_time_format', []);
  }
  get time_format() {
    return chrome.i18n.getMessage('time_format', []);
  }
  get time_period_am() {
    return chrome.i18n.getMessage('time_period_am', []);
  }
  get time_period_pm() {
    return chrome.i18n.getMessage('time_period_pm', []);
  }
  get sunday() {
    return chrome.i18n.getMessage('sunday', []);
  }
  get monday() {
    return chrome.i18n.getMessage('monday', []);
  }
  get tuesday() {
    return chrome.i18n.getMessage('tuesday', []);
  }
  get wednesday() {
    return chrome.i18n.getMessage('wednesday', []);
  }
  get thursday() {
    return chrome.i18n.getMessage('thursday', []);
  }
  get friday() {
    return chrome.i18n.getMessage('friday', []);
  }
  get saturday() {
    return chrome.i18n.getMessage('saturday', []);
  }
  get sunday_short() {
    return chrome.i18n.getMessage('sunday_short', []);
  }
  get monday_short() {
    return chrome.i18n.getMessage('monday_short', []);
  }
  get tuesday_short() {
    return chrome.i18n.getMessage('tuesday_short', []);
  }
  get wednesday_short() {
    return chrome.i18n.getMessage('wednesday_short', []);
  }
  get thursday_short() {
    return chrome.i18n.getMessage('thursday_short', []);
  }
  get friday_short() {
    return chrome.i18n.getMessage('friday_short', []);
  }
  get saturday_short() {
    return chrome.i18n.getMessage('saturday_short', []);
  }
  get january() {
    return chrome.i18n.getMessage('january', []);
  }
  get february() {
    return chrome.i18n.getMessage('february', []);
  }
  get march() {
    return chrome.i18n.getMessage('march', []);
  }
  get april() {
    return chrome.i18n.getMessage('april', []);
  }
  get may() {
    return chrome.i18n.getMessage('may', []);
  }
  get june() {
    return chrome.i18n.getMessage('june', []);
  }
  get july() {
    return chrome.i18n.getMessage('july', []);
  }
  get august() {
    return chrome.i18n.getMessage('august', []);
  }
  get september() {
    return chrome.i18n.getMessage('september', []);
  }
  get october() {
    return chrome.i18n.getMessage('october', []);
  }
  get november() {
    return chrome.i18n.getMessage('november', []);
  }
  get december() {
    return chrome.i18n.getMessage('december', []);
  }
  get january_short() {
    return chrome.i18n.getMessage('january_short', []);
  }
  get february_short() {
    return chrome.i18n.getMessage('february_short', []);
  }
  get march_short() {
    return chrome.i18n.getMessage('march_short', []);
  }
  get april_short() {
    return chrome.i18n.getMessage('april_short', []);
  }
  get may_short() {
    return chrome.i18n.getMessage('may_short', []);
  }
  get june_short() {
    return chrome.i18n.getMessage('june_short', []);
  }
  get july_short() {
    return chrome.i18n.getMessage('july_short', []);
  }
  get august_short() {
    return chrome.i18n.getMessage('august_short', []);
  }
  get september_short() {
    return chrome.i18n.getMessage('september_short', []);
  }
  get october_short() {
    return chrome.i18n.getMessage('october_short', []);
  }
  get november_short() {
    return chrome.i18n.getMessage('november_short', []);
  }
  get december_short() {
    return chrome.i18n.getMessage('december_short', []);
  }
  in_month(month) {
    return chrome.i18n.getMessage('in_month', [month]);
  }
  get import_history() {
    return chrome.i18n.getMessage('import_history', []);
  }
  get export_history() {
    return chrome.i18n.getMessage('export_history', []);
  }
  get confirm_import() {
    return chrome.i18n.getMessage('confirm_import', []);
  }
  import_failed(error) {
    return chrome.i18n.getMessage('import_failed', [error]);
  }
  group_pomodoros_minute_buckets(count) {
    return chrome.i18n.getMessage('group_pomodoros_minute_buckets', [count]);
  }
  group_pomodoros_hour_buckets(count) {
    return chrome.i18n.getMessage('group_pomodoros_hour_buckets', [count]);
  }
  min_suffix(count) {
    return chrome.i18n.getMessage('min_suffix', [count]);
  }
  hr_suffix(count) {
    return chrome.i18n.getMessage('hr_suffix', [count]);
  }
  get write_a_review() {
    return chrome.i18n.getMessage('write_a_review', []);
  }
  get report_an_issue() {
    return chrome.i18n.getMessage('report_an_issue', []);
  }
  get release_notes() {
    return chrome.i18n.getMessage('release_notes', []);
  }
  get source_code() {
    return chrome.i18n.getMessage('source_code', []);
  }
  get attributions() {
    return chrome.i18n.getMessage('attributions', []);
  }
  get license() {
    return chrome.i18n.getMessage('license', []);
  }
  get view() {
    return chrome.i18n.getMessage('view', []);
  }
  get version() {
    return chrome.i18n.getMessage('version', []);
  }
  get disclaimer() {
    return chrome.i18n.getMessage('disclaimer', []);
  }
  get and() {
    return chrome.i18n.getMessage('and', []);
  }
  get contributors() {
    return chrome.i18n.getMessage('contributors', []);
  }
  get completed_today() {
    return chrome.i18n.getMessage('completed_today', []);
  }
  get view_history() {
    return chrome.i18n.getMessage('view_history', []);
  }
  pomodoros_until_long_break(pomodoros) {
    return chrome.i18n.getMessage('pomodoros_until_long_break', [pomodoros]);
  }
  pomodoros_completed_today(pomodoros) {
    return chrome.i18n.getMessage('pomodoros_completed_today', [pomodoros]);
  }
  get start_focusing_now() {
    return chrome.i18n.getMessage('start_focusing_now', []);
  }
  get take_a_break() {
    return chrome.i18n.getMessage('take_a_break', []);
  }
  get take_a_short_break() {
    return chrome.i18n.getMessage('take_a_short_break', []);
  }
  get take_a_long_break() {
    return chrome.i18n.getMessage('take_a_long_break', []);
  }
  get start_break_now() {
    return chrome.i18n.getMessage('start_break_now', []);
  }
  get start_short_break_now() {
    return chrome.i18n.getMessage('start_short_break_now', []);
  }
  get start_long_break_now() {
    return chrome.i18n.getMessage('start_long_break_now', []);
  }
  browser_action_tooltip(title, text) {
    return chrome.i18n.getMessage('browser_action_tooltip', [title, text]);
  }
  n_minutes(count) {
    return chrome.i18n.getMessage('n_minutes', [count]);
  }
  get less_than_minute() {
    return chrome.i18n.getMessage('less_than_minute', []);
  }
  time_remaining(time) {
    return chrome.i18n.getMessage('time_remaining', [time]);
  }
  get missing_pomodoro_data() {
    return chrome.i18n.getMessage('missing_pomodoro_data', []);
  }
  get missing_duration_data() {
    return chrome.i18n.getMessage('missing_duration_data', []);
  }
  get missing_timezone_data() {
    return chrome.i18n.getMessage('missing_timezone_data', []);
  }
  get mismatched_pomodoro_duration_data() {
    return chrome.i18n.getMessage('mismatched_pomodoro_duration_data', []);
  }
  get mismatched_pomodoro_timezone_data() {
    return chrome.i18n.getMessage('mismatched_pomodoro_timezone_data', []);
  }
  get help_translate() {
    return chrome.i18n.getMessage('help_translate', []);
  }
  get expire_title() {
    return chrome.i18n.getMessage('expire_title', []);
  }
  get gong_1() {
    return chrome.i18n.getMessage('gong_1', []);
  }
  get gong_2() {
    return chrome.i18n.getMessage('gong_2', []);
  }
  get computer_magic() {
    return chrome.i18n.getMessage('computer_magic', []);
  }
  get fire_pager() {
    return chrome.i18n.getMessage('fire_pager', []);
  }
  get glass_ping() {
    return chrome.i18n.getMessage('glass_ping', []);
  }
  get music_box() {
    return chrome.i18n.getMessage('music_box', []);
  }
  get pin_drop() {
    return chrome.i18n.getMessage('pin_drop', []);
  }
  get robot_blip_1() {
    return chrome.i18n.getMessage('robot_blip_1', []);
  }
  get robot_blip_2() {
    return chrome.i18n.getMessage('robot_blip_2', []);
  }
  get ship_bell() {
    return chrome.i18n.getMessage('ship_bell', []);
  }
  get train_horn() {
    return chrome.i18n.getMessage('train_horn', []);
  }
  get bike_horn() {
    return chrome.i18n.getMessage('bike_horn', []);
  }
  get bell_ring() {
    return chrome.i18n.getMessage('bell_ring', []);
  }
  get reception_bell() {
    return chrome.i18n.getMessage('reception_bell', []);
  }
  get toaster_oven() {
    return chrome.i18n.getMessage('toaster_oven', []);
  }
  get battle_horn() {
    return chrome.i18n.getMessage('battle_horn', []);
  }
  get ding() {
    return chrome.i18n.getMessage('ding', []);
  }
  get dong() {
    return chrome.i18n.getMessage('dong', []);
  }
  get ding_dong() {
    return chrome.i18n.getMessage('ding_dong', []);
  }
  get airplane() {
    return chrome.i18n.getMessage('airplane', []);
  }
  get digital_watch() {
    return chrome.i18n.getMessage('digital_watch', []);
  }
  get analog_alarm_clock() {
    return chrome.i18n.getMessage('analog_alarm_clock', []);
  }
  get digital_alarm_clock() {
    return chrome.i18n.getMessage('digital_alarm_clock', []);
  }
  get stopwatch() {
    return chrome.i18n.getMessage('stopwatch', []);
  }
  get clock() {
    return chrome.i18n.getMessage('clock', []);
  }
  get wall_clock() {
    return chrome.i18n.getMessage('wall_clock', []);
  }
  get desk_clock() {
    return chrome.i18n.getMessage('desk_clock', []);
  }
  get antique_clock() {
    return chrome.i18n.getMessage('antique_clock', []);
  }
  get small_clock() {
    return chrome.i18n.getMessage('small_clock', []);
  }
  get large_clock() {
    return chrome.i18n.getMessage('large_clock', []);
  }
  get wristwatch() {
    return chrome.i18n.getMessage('wristwatch', []);
  }
  get wind_up_clock() {
    return chrome.i18n.getMessage('wind_up_clock', []);
  }
  get metronome() {
    return chrome.i18n.getMessage('metronome', []);
  }
  get wood_block() {
    return chrome.i18n.getMessage('wood_block', []);
  }
  get pulse() {
    return chrome.i18n.getMessage('pulse', []);
  }
  get save_changes() {
    return chrome.i18n.getMessage('save_changes', []);
  }
  get save_changes_notice() {
    return chrome.i18n.getMessage('save_changes_notice', []);
  }
  error_saving_settings(message) {
    return chrome.i18n.getMessage('error_saving_settings', [message]);
  }
  unknown_service(name) {
    return chrome.i18n.getMessage('unknown_service', [name]);
  }
}

export default new Messages();
