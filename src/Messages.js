const languages = {
   "ar": "Arabic",
   "bn": "Bengali",
   "ca": "Catalan",
   "cs": "Czech",
   "da": "Danish",
   "de": "German",
   "el": "Greek",
   "en": "English",
   "en_GB": "English (Great Britain)",
   "es": "Spanish",
   "fa": "Persian",
   "fi": "Finnish",
   "fr": "French",
   "he": "Hebrew",
   "id": "Indonesian",
   "it": "Italian",
   "ja": "Japanese",
   "lt": "Lithuanian",
   "ms": "Malay",
   "nl": "Dutch",
   "no": "Norwegian",
   "pl": "Polish",
   "pt_BR": "Portuguese (Brazil)",
   "pt_PT": "Portuguese (Portugal)",
   "ro": "Romanian",
   "ru": "Russian",
   "sr": "Serbian",
   "sv": "Swedish",
   "sw": "Swahili",
   "te": "Telugu",
   "th": "Thai",
   "tr": "Turkish",
   "uk": "Ukrainian",
   "vi": "Vietnamese",
   "zh_CN": "Chinese (China)",
   "zh_TW": "Chinese (Taiwan)"
  };

const messages_static =
  ["airplane"
  ,"analog_alarm_clock"
  ,"and"
  ,"antique_clock"
  ,"app_desc"
  ,"app_name"
  ,"app_name_short"
  ,"april"
  ,"april_short"
  ,"attributions"
  ,"august"
  ,"august_short"
  ,"autostart_description"
  ,"autostart_notification_message"
  ,"autostart_notification_title"
  ,"autostart_title"
  ,"battle_horn"
  ,"bell_ring"
  ,"bike_horn"
  ,"bpm"
  ,"brown_noise"
  ,"browser_default"
  ,"chrome_web_store_description"
  ,"clear_history"
  ,"clear_history_confirmation"
  ,"clear_history_description"
  ,"clock"
  ,"completed_today"
  ,"computer_magic"
  ,"contributors"
  ,"countdown"
  ,"countdown_autoclose_tab"
  ,"countdown_autoclose_window"
  ,"countdown_timer"
  ,"custom"
  ,"daily_distribution"
  ,"daily_empty_placeholder"
  ,"date_format"
  ,"date_time_format"
  ,"december"
  ,"december_short"
  ,"decimal_separator"
  ,"desk_clock"
  ,"digital_alarm_clock"
  ,"digital_watch"
  ,"ding"
  ,"ding_dong"
  ,"disclaimer"
  ,"do_not_show"
  ,"dong"
  ,"duration"
  ,"duration_seconds"
  ,"electronic_chime"
  ,"end_date"
  ,"end_iso_8601"
  ,"end_time"
  ,"end_timestamp"
  ,"end_timezone"
  ,"every_10th_break"
  ,"every_2nd_break"
  ,"every_3rd_break"
  ,"every_4th_break"
  ,"every_5th_break"
  ,"every_6th_break"
  ,"every_7th_break"
  ,"every_8th_break"
  ,"every_9th_break"
  ,"expire_title"
  ,"export"
  ,"export_description"
  ,"february"
  ,"february_short"
  ,"feedback"
  ,"fire_pager"
  ,"focus"
  ,"friday"
  ,"friday_short"
  ,"fullscreen"
  ,"glass_ping"
  ,"gong_1"
  ,"gong_2"
  ,"heatmap_date_format"
  ,"height"
  ,"help_translate"
  ,"history"
  ,"history_empty_placeholder"
  ,"hour_format"
  ,"hour_minute_format"
  ,"hover_preview"
  ,"import"
  ,"import_confirmation"
  ,"import_description"
  ,"invalid_duration_data"
  ,"invalid_pomodoro_data"
  ,"invalid_timezone_data"
  ,"january"
  ,"january_short"
  ,"july"
  ,"july_short"
  ,"june"
  ,"june_short"
  ,"language"
  ,"large_clock"
  ,"less_than_minute"
  ,"license"
  ,"long_break"
  ,"march"
  ,"march_short"
  ,"marinara_pomodoro_assistant"
  ,"may"
  ,"may_short"
  ,"metronome"
  ,"minutes"
  ,"mismatched_pomodoro_duration_data"
  ,"mismatched_pomodoro_timezone_data"
  ,"missing_duration_data"
  ,"missing_pomodoro_data"
  ,"missing_timezone_data"
  ,"monday"
  ,"monday_short"
  ,"music_box"
  ,"never"
  ,"noise"
  ,"none"
  ,"november"
  ,"november_short"
  ,"october"
  ,"october_short"
  ,"override_language"
  ,"pause_timer"
  ,"periodic_beat"
  ,"pin_drop"
  ,"pink_noise"
  ,"play_audio_notification"
  ,"pomodoro_assistant"
  ,"pomodoro_count_one"
  ,"pomodoro_count_zero"
  ,"pomodoro_history"
  ,"pulse"
  ,"reception_bell"
  ,"release_notes"
  ,"report_an_issue"
  ,"restart_pomodoro_cycle"
  ,"restart_timer"
  ,"resume_timer"
  ,"robot_blip_1"
  ,"robot_blip_2"
  ,"saturday"
  ,"saturday_short"
  ,"save_as_csv"
  ,"save_as_csv_description"
  ,"september"
  ,"september_short"
  ,"settings"
  ,"settings_saved"
  ,"ship_bell"
  ,"short_break"
  ,"show_desktop_notification"
  ,"show_in_tab"
  ,"show_in_window"
  ,"show_new_tab_notification"
  ,"small_clock"
  ,"source_code"
  ,"speed_label"
  ,"start_break"
  ,"start_break_now"
  ,"start_focusing"
  ,"start_focusing_now"
  ,"start_long_break"
  ,"start_long_break_now"
  ,"start_pomodoro_cycle"
  ,"start_short_break"
  ,"start_short_break_now"
  ,"stop_timer"
  ,"stopwatch"
  ,"sunday"
  ,"sunday_short"
  ,"take_a_break"
  ,"take_a_long_break"
  ,"take_a_long_break_setting"
  ,"take_a_short_break"
  ,"this_month"
  ,"this_week"
  ,"thousands_separator"
  ,"thursday"
  ,"thursday_short"
  ,"time"
  ,"time_format"
  ,"time_period_am"
  ,"time_period_pm"
  ,"timer_paused"
  ,"timer_sound_label"
  ,"toaster_oven"
  ,"today"
  ,"tone"
  ,"total"
  ,"train_horn"
  ,"tuesday"
  ,"tuesday_short"
  ,"version"
  ,"view"
  ,"view_history"
  ,"wall_clock"
  ,"wednesday"
  ,"wednesday_short"
  ,"weekly_distribution"
  ,"weekly_empty_placeholder"
  ,"when_complete"
  ,"white_noise"
  ,"width"
  ,"wind_up_clock"
  ,"wood_block"
  ,"wristwatch"
  ,"write_a_review"
  ,"your_history"
  ];

const messages_dynamic =
  [
  ,"average_stat" // average
  ,"browser_action_tooltip" // title, text
  ,"daily_tooltip" // pomodoros, start, end
  ,"error_saving_settings" // message
  ,"group_pomodoros_hour_buckets" // count
  ,"group_pomodoros_minute_buckets" // count
  ,"heatmap_tooltip" // pomodoros, date
  ,"hr_suffix" // count
  ,"import_failed" // error
  ,"in_month" // month
  ,"last_9_months" // count
  ,"min_suffix" // count
  ,"n_minutes" // count
  ,"pomodoro_count_many" // count
  ,"pomodoros_completed_today" // pomodoros
  ,"pomodoros_imported" // pomodoros
  ,"pomodoros_until_long_break" // pomodoros
  ,"time_remaining" // time
  ,"weekly_tooltip" // pomodoros, day
  ];

let latest_language_fetched = '';
let messages_kv = {};

async function refreshLang(settings) {
  const locale = settings.language_override;
  if(!locale.length) {
    latest_language_fetched = '';
    return true;
  }
  if(!Object.keys(languages).includes(locale))
    return false;
  if(locale == latest_language_fetched)
    return true;
  return fetch("../_locales/"+locale+"/messages.json")
    .then( response => response.json() )
    .then( json => {
      messages_kv = json;
      latest_language_fetched = locale;
      return true;
    } )
}

function filter_apply(string_key, substitutes) {
  if(!latest_language_fetched.length)
    return chrome.i18n.getMessage(string_key, substitutes);
  const string = messages_kv[string_key]?.message || undefined;
  let replacement_index = 0;
  return typeof string === 'undefined'
    ? chrome.i18n.getMessage(string_key, substitutes)
    : string.replace(/\$[A-z_-]+\$/g
      ,() => substitutes[replacement_index++] ?? ""
    );
}

const message_accessors_static = messages_static
  .map( key => ({[key]:
    {get: () => filter_apply(key) }
  }) );
const message_accessors_dynamic = messages_dynamic
  .map( key => ({[key]:
    {value: (...args) => filter_apply(key, args) }
  }) );

const M = {};
Object.defineProperties(M,
  [...message_accessors_static
  ,...message_accessors_dynamic
  ].reduce( (carry, kv) => ({...carry,...kv}), ({}) )
);

export {
  M,
  refreshLang,
  languages
};
