#include <DHT.h>
#include <ESP8266WiFi.h>
#include <Servo.h>
#include <Wire.h>
#include "RTClib.h"
#include <LiquidCrystal_I2C.h>
#include <FirebaseESP8266.h> 

// === Pin Config ===
#define DHTPIN        D5
#define DHTTYPE       DHT11
#define FAN_PIN       D8
#define BUTTON_PIN    D6
#define SERVO1_PIN    D4
#define SERVO2_PIN    D3
#define SERVO3_PIN    D7
#define BUZZER_PIN    D0

// === Đối tượng ===
DHT dht(DHTPIN, DHTTYPE);
Servo servo1, servo2, servo3;
RTC_DS3231 rtc;
LiquidCrystal_I2C lcd(0x27, 16, 2);

// === Firebase ===
const char* ssid     = "Tuan";
const char* password = "dotuangv2";
#define API_KEY       "AIzaSyB3gJvm_svL3pSdYRSYel5P5if6YkO-LKU"  // Điền API Key của bạn
#define DATABASE_URL  "vdl10-ck-default-rtdb.asia-southeast1.firebasedatabase.app"  // Điền URL Database

FirebaseData fbdo;
FirebaseJson json;
FirebaseConfig config;
FirebaseAuth auth;

// === Biến toàn cục ===
float threshold_temp = 31.0;
float threshold_humi = 80.0;
volatile bool servo_triggered = false;
bool door_state = false; // true = mở, false = đóng
unsigned long lastUpload = 0;
const unsigned long uploadInterval = 10000;
long lastBuzzer = -60000;
String morning = "closed";
String noon = "closed";
String evening = "closed";


// === Ngắt nút nhấn ===
void IRAM_ATTR handleButtonPress() {
  servo_triggered = true;
}

struct TimeEvent {
  String label;       // Tên buổi
  String timeStart;   // Dạng chuỗi "hh:mm"
  String timeEnd;     // Dạng chuỗi "hh:mm"
  int executed = 0;   // Đã chạy chưa
  int timeOfBuzzer = 0;
  bool enabled = true;
  String lastDoorStatus = "closed";
  Servo* servo;       // Servo tương ứng

  void executeDoor(){
    if(executed == 0) {
      servo->write(0); // hoặc góc mở
      Serial.println("🔓 Mở cửa cho: " + label);
      Firebase.setString(fbdo,   "/status/cabinet/" + label, "opened");
      Firebase.setBool(fbdo, "/settings/reminderTimes/" + label + "/drank", true);
      lastDoorStatus = "opened";
    }else if(executed == 1) {
      servo->write(180); // hoặc góc đóng
      Serial.println("🔒 Đóng cửa cho: " + label);
      Firebase.setString(fbdo,   "/status/cabinet/" + label, "closed");
      lastDoorStatus = "closed";
    }
    if(executed < 2) executed ++;
  }

  void execute(){
    if(lastDoorStatus == "closed"){
      servo->write(0); // hoặc góc mở
      Serial.println("🔓 Mở cửa cho: " + label);
      lastDoorStatus = "opened";
    }else {
      servo->write(180); // hoặc góc đóng
      Serial.println("🔒 Đóng cửa cho: " + label);
      lastDoorStatus = "closed";
    }
  }

  void Print() {
    Serial.print("⏰ Label: ");
    Serial.print(label);
    Serial.print(" | Start: ");
    Serial.print(timeStart);
    Serial.print(" | End: ");
    Serial.print(timeEnd);
    Serial.print(" | Enaled: ");
    Serial.print(enabled);
    Serial.print(" | Executed: ");
    Serial.println(executed > 0 ? "true" : "false");

  }
};


TimeEvent events[] = {
  {"morning", "7:00", "8:00", 0, 0, true, "closed", &servo1},
  {"noon",    "12:00", "13:00", 0, 0, true, "closed", &servo2},
  {"evening", "18:00", "19:00", 0, 0, true, "closed", &servo3}
};

// === Hàm setup ===
void setup() {
  Serial.begin(9600);
  pinMode(BUZZER_PIN, OUTPUT);
  // Pin setup
  Wire.begin(D2, D1);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), handleButtonPress, FALLING);

  // WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("🔌 Kết nối WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" ✅ Đã kết nối");
  Serial.print("IP: "); Serial.println(WiFi.localIP());

  // RTC
  if (!rtc.begin()) {
    Serial.println("❌ Không tìm thấy DS3231!");
    lcd.print("Khong tim thay RTC");
    while (1);
  }
  if (rtc.lostPower()) {
    Serial.println("⚠️ DS3231 mất nguồn, thiết lập lại thời gian.");
    rtc.adjust(DateTime(F(_DATE_), F(_TIME_)));
  }

  // LCD
  lcd.init(); 
  lcd.backlight();

  // Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.signer.test_mode = true;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  if (Firebase.ready()) {
    Serial.println("🔥 Firebase sẵn sàng");
  } else {
    Serial.println("❌ Firebase chưa sẵn sàng");
  }

  // Cảm biến & Servo
  dht.begin();
  servo1.attach(SERVO1_PIN);
  servo2.attach(SERVO2_PIN);
  servo3.attach(SERVO3_PIN);

  servo1.write(0);
  servo2.write(0);
  servo3.write(0);
}

// === In thời gian & ngày lên LCD ===
void LCD_Print(DateTime &now, float huminity, float temperature) {
  lcd.setCursor(0, 0);
  lcd.printf("Time: %02d:%02d:%02d", now.hour(), now.minute(), now.second());

  lcd.setCursor(0, 1);
  lcd.printf("H:%.2f, T:%.2f", huminity, temperature);
}

// === Điều khiển quạt ===
void Fan(bool isOn) {
  digitalWrite(FAN_PIN, isOn ? HIGH : LOW);
}

int parseTimeToMinutes(const String& timeStr) {
  int sep = timeStr.indexOf(":");
  int hour = timeStr.substring(0, sep).toInt();
  int minute = timeStr.substring(sep + 1).toInt();
  return hour * 60 + minute;
}

bool checkAndExecuteTimeEvents(DateTime now) {
  int currentMinute = now.hour() * 60 + now.minute();
  bool flag = false;
  for (int i = 0; i < 3; i++) {
    TimeEvent& e = events[i];
    if (!e.enabled) continue;
    int startMinute = parseTimeToMinutes(e.timeStart);
    int endMinute = parseTimeToMinutes(e.timeEnd);

    if (currentMinute >= startMinute && currentMinute <= endMinute) {
      if (e.executed < 2) {
        e.executeDoor();
        flag = true;
      }
    } else if(currentMinute > endMinute) e.executed = 0;
  }
  return flag;
}

void setTimeEvents(DateTime now){
  if(Firebase.getString(fbdo, "/settings/reminderTimes/morning/start")) events[0].timeStart = fbdo.stringData();
  if(Firebase.getString(fbdo, "/settings/reminderTimes/morning/end")) events[0].timeEnd = fbdo.stringData();
  if(Firebase.getBool(fbdo, "/settings/reminderTimes/morning/enabled")) events[0].enabled = fbdo.boolData();
  if(Firebase.getString(fbdo, "/settings/reminderTimes/noon/start")) events[1].timeStart = fbdo.stringData();
  if(Firebase.getString(fbdo, "/settings/reminderTimes/noon/end")) events[1].timeEnd = fbdo.stringData();
  if(Firebase.getBool(fbdo, "/settings/reminderTimes/noon/enabled")) events[1].enabled = fbdo.boolData();
  if(Firebase.getString(fbdo, "/settings/reminderTimes/evening/start")) events[2].timeStart = fbdo.stringData();
  if(Firebase.getString(fbdo, "/settings/reminderTimes/evening/end")) events[2].timeEnd = fbdo.stringData();
  if(Firebase.getBool(fbdo, "/settings/reminderTimes/evening/enabled")) events[2].enabled = fbdo.boolData();
  if(Firebase.getString(fbdo, "/status/cabinet/morning")) morning = fbdo.stringData();
  if(Firebase.getString(fbdo, "/status/cabinet/noon")) noon = fbdo.stringData();
  if(Firebase.getString(fbdo, "/status/cabinet/evening")) evening = fbdo.stringData();
  Serial.print(morning + " ");
  Serial.println(events[0].lastDoorStatus);
  Serial.print(noon + " ");
  Serial.println(events[1].lastDoorStatus);
  Serial.print(evening + " ");
  Serial.println(events[2].lastDoorStatus);
  if(events[0].lastDoorStatus != morning) events[0].execute();
  if(events[1].lastDoorStatus != noon) events[1].execute();
  if(events[2].lastDoorStatus != evening) events[2].execute();
  
  int currentMinute = now.hour() * 60 + now.minute();
  for(int i = 0; i < 3; i++){
    TimeEvent& e = events[i];
    int endMinute = parseTimeToMinutes(e.timeEnd);
    int startMinute = parseTimeToMinutes(e.timeStart);
    // Serial.println(currentMinute);
    // Serial.println(endMinute);

    if (currentMinute >= startMinute && currentMinute <= endMinute) {
      if(e.enabled && e.executed == 0) {
        // Serial.println(millis());
        // Serial.println(lastBuzzer);
        // Serial.print(timeOfBuzzer);
        if(millis() - lastBuzzer >= 60000) {
          if(e.timeOfBuzzer < 6){
            Serial.println("Đã đến giờ uống thuốc");
            if(e.timeOfBuzzer % 2 == 0) digitalWrite(BUZZER_PIN, HIGH);
            else digitalWrite(BUZZER_PIN, LOW);
            lastBuzzer = millis();
            e.timeOfBuzzer += 1;
          }else {
            // Cảnh báo qua điện thoại
          }
        }
      }
      if(e.executed != 0) digitalWrite(BUZZER_PIN, LOW);
    }

    if(currentMinute > endMinute) {
      if(e.timeOfBuzzer > 0 || e.executed != 0){
        digitalWrite(BUZZER_PIN, LOW);
      }
      e.executed = 0;
      e.timeOfBuzzer = 0;
    }
  }
}

void uploadToFirebase(float temperature, float humidity) {
  DateTime now = rtc.now();  // Lấy thời gian hiện tại từ DS3231

  // Format thời gian theo dạng ISO 8601: yyyy-MM-ddTHH:mm:ss
  char timestamp[25];
  sprintf(timestamp, "%04d-%02d-%02dT%02d:%02d:%02d",
          now.year(), now.month(), now.day(),
          now.hour(), now.minute(), now.second());

  // Tạo một JSON object để gửi lên
  FirebaseJson json;
  json.set("temperature", temperature);
  json.set("humidity", humidity);

  String path = "/history/" + String(timestamp);
  bool success = Firebase.setJSON(fbdo, path, json);

  if (success) {
    Serial.println("✅ Đã ghi dữ liệu vào Firebase!");
  } else {
    Serial.println("❌ Lỗi ghi Firebase: " + fbdo.errorReason());
  }
}

// === Loop chính ===
void loop() {
  if(Firebase.getDouble(fbdo, "/settings/alertThresholds/humidity")) threshold_humi = fbdo.doubleData();
  if(Firebase.getDouble(fbdo, "/settings/alertThresholds/temperature")) threshold_temp = fbdo.doubleData();
  DateTime now = rtc.now();
  setTimeEvents(now);
  // events[0].Print();
  // events[1].Print();
  // events[2].Print();
  // Serial.print("Threshold humidity");
  // Serial.println(threshold_humi);
  // Serial.print("Threshold temperature");
  // Serial.println(threshold_temp);


  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // In nhiệt độ và độ ẩm
  if (isnan(h) || isnan(t)) {
    Serial.println("❌ Không đọc được dữ liệu DHT11.");
  } else {
    Serial.printf("🌡 Nhiệt độ: %.1f°C | 💧 Độ ẩm: %.1f%%\n", t, h);
    if(millis() - lastUpload >= uploadInterval){
      uploadToFirebase(t, h);
      lastUpload = millis();
    }
  }

  LCD_Print(now, h, t);

  // Bật quạt nếu vượt ngưỡng
  Fan(t >= threshold_temp || h >= threshold_humi);

  // Xử lý nút nhấn
  if (servo_triggered) {
    servo_triggered = false;
    Serial.println("🟢 Nút nhấn - điều khiển servo");
    if (!checkAndExecuteTimeEvents(now)) Serial.println("Không phải giờ uống thuốc");

  }

  delay(1000); // giữ tần suất ổn định
}