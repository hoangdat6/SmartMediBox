# SmartMediBox - IoT Smart Medicine Cabinet 💊

An IoT-enabled smart medicine cabinet built with ESP8266 and a React Native mobile application, designed to help users maintain medication adherence and proper medicine storage conditions.

## Project Overview

SmartMediBox addresses the critical challenge of medication adherence by providing an automated, connected medicine cabinet with a companion mobile application. The system ensures patients take the right medication at the right time, monitors storage conditions, and provides real-time updates through Firebase.

## Key Features

- **Automated Medication Reminders** - Audio and visual alerts when it's time to take medicine
- **Smart Compartment System** - Automatic opening of the correct medicine compartment at scheduled times
- **Environmental Monitoring** - Temperature and humidity monitoring with active humidity control
- **Mobile Application** - Remote monitoring and control via React Native app
- **Real-time Synchronization** - Firebase integration for real-time data and notifications
- **Medication History** - Track and analyze medication adherence patterns

## Hardware Components

| Component | Quantity | Purpose |
|-----------|----------|---------|
| ESP8266 NodeMCU | 1 | Main processor, WiFi connectivity |
| DS3231 RTC | 1 | Real-time clock |
| 16x2 I2C LCD | 1 | Display information and alerts |
| Push Button | 1 | Manual compartment opening (interrupt) |
| SG90 Servo Motors | 3 | Open morning/noon/evening compartments |
| DHT11 Sensor | 1 | Temperature and humidity monitoring |
| Mini Fan | 1 | Humidity reduction |
| Buzzer | 1 | Sound alerts |
| NPN Transistors (2N2222) | 2 | Control fan and speaker |
| 5V Power Supply/Battery | 1 | Power the system |

## Hardware Connection Diagram

| Device | Function | ESP8266 Connection | Notes |
|--------|----------|-------------------|-------|
| Push Button | Send open signal | D3 (GPIO0) | Uses attachInterrupt() |
| DS3231 | Real-time clock | SDA → D2 (GPIO4)<br>SCL → D1 (GPIO5) | I2C protocol, shared with LCD |
| 16x2 I2C LCD | Display time and alerts | SDA → D2 (GPIO4)<br>SCL → D1 (GPIO5) | I2C protocol |
| Morning Servo | Open morning compartment | D5 (GPIO14) | PWM control |
| Noon Servo | Open noon compartment | D6 (GPIO12) | PWM control |
| Evening Servo | Open evening compartment | D7 (GPIO13) | PWM control |
| DHT11 | Temperature/humidity sensor | D0 (GPIO16) | Digital read |
| Mini Fan | Reduce humidity | D8 (GPIO15) | Controlled via NPN transistor |
| Buzzer | Sound alerts | A0 | Via transistor if high power needed |

## Technologies Used

| Category | Technology/Protocol |
|----------|-------------------|
| IoT Communication | Firebase Realtime Database (WebSocket) |
| Microcontroller | ESP8266 NodeMCU |
| Real-time Clock | DS3231 |
| Device Communication | I2C (LCD, DS3231) |
| Sensor Communication | Digital (DHT11, Push Button) |
| Device Control | PWM (Servo), GPIO with transistors (Fan, Buzzer) |
| Mobile Application | React Native + Firebase SDK |
| Data Storage | Firebase Cloud |
| Notifications | Firebase Cloud Messaging (FCM) |

## Software Architecture

```
SmartMediBox/
├── app/                 # Main application source code
│   ├── screens/         # UI screens
│   ├── navigation/      # Navigation configuration
│   └── context/         # State management
├── assets/              # Images, fonts, and other resources
├── components/          # Reusable UI components
├── services/            # API and database services
├── hooks/               # Custom React hooks
└── utils/               # Helper functions and utilities
```

## Screenshots

![Login Screen](path/to/login-screenshot.png)
![Medication List](path/to/medication-list-screenshot.png)
![Add Medication](path/to/add-medication-screenshot.png)
![Reminder Setup](path/to/reminder-setup-screenshot.png)

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the application

   ```bash
   npx expo start
   ```

After launching, you can open the app in:
- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

## Implementation Timeline

- **Phase 1** (Completed): Basic app UI and medication tracking
- **Phase 2** (Current): Hardware integration and reminder system
- **Phase 3** (Upcoming): Analytics dashboard and caregiver features

## Contributing

If you have questions or suggestions, please create an issue or contact our team.

## License

This project is distributed under the MIT License.
