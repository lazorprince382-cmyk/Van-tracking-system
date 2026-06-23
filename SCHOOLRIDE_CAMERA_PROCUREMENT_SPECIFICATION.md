# SCHOOLRIDE VAN CAMERA SYSTEM

## Supplier Quotation and Technical Compliance Sheet

**Purpose:** Supply and install a complete vehicle camera, recording, GPS and live-streaming system that can integrate with the SchoolRide Van Tracking System.

**Important:** This is not a request for ordinary home or building CCTV cameras. All equipment must be designed or certified for use in moving vehicles.

---

## 1. Required system per van

The supplier shall quote for one complete system containing:

| Item | Minimum quantity | Requirement |
|---|---:|---|
| 4-channel mobile DVR/NVR | 1 | Vehicle-rated recorder with 4G, GPS, recording and open integration |
| Interior passenger camera | 1 | Wide-angle infrared camera covering the passenger cabin |
| Front road camera | 1 | Camera covering the road ahead |
| Rear/door camera | 1 | Waterproof camera covering the rear or main entry door |
| Driver/second-door camera | 1 | Camera covering the driver area or an additional door/side view |
| Vehicle-rated storage | 1 | Minimum 1 TB SSD, or equivalent lockable high-endurance storage |
| 4G and GPS antennas | 1 set | External antennas, cables and mounting accessories |
| Complete wiring kit | 1 set | Locking camera cables, fuses, power protection and connectors |
| Installation and configuration | 1 | Complete installation, testing and SchoolRide integration support |

---

## 2. Camera specifications

### A. Interior passenger camera

- Vehicle-rated dome camera.
- Minimum resolution: 1920 × 1080, 2 megapixels.
- Wide viewing angle: approximately 110–130 degrees.
- Infrared night vision with no visible distracting light.
- Clear images in bright and dark areas; WDR preferred.
- Minimum frame rate: 15 FPS; 25 FPS preferred.
- Built-in microphone or compatible audio input where legally permitted.
- Anti-vibration and tamper-resistant mounting.
- Correct locking connector compatible with the mobile DVR, preferably a 4-pin aviation connector.
- Camera must be powered through the DVR/camera cable where possible.

### B. Front road camera

- Minimum 1080p resolution.
- Approximately 90–110-degree viewing angle.
- Wide Dynamic Range for sunlight, shadows and headlights.
- Clear daytime and night-time road footage.
- Suitable for windscreen or external vehicle mounting.
- If installed behind the windscreen, infrared must be disabled or designed to avoid glass reflection.
- Number plates should be reasonably identifiable at normal school-van distances and speeds.

### C. Rear or door camera

- Minimum 1080p resolution.
- Minimum IP67 weather protection; IP69K preferred for an exterior installation.
- Infrared night vision.
- Approximately 110–130-degree viewing angle.
- Anti-vibration, waterproof cable connection and corrosion-resistant housing.
- Image orientation/mirror mode must be configurable.

### D. Driver or additional door camera

- Minimum 1080p resolution.
- Infrared night vision.
- Wide-angle coverage of the driver area, entry door or selected side of the van.
- Tamper-resistant and anti-vibration mounting.
- Audio support preferred where legally permitted.

---

## 3. Mobile DVR/NVR requirements

The recorder must meet all the following minimum requirements:

- Minimum four camera channels.
- Compatible with all supplied cameras.
- Minimum 1080p recording on every channel.
- H.264 and/or H.265 video compression; H.265 preferred.
- Simultaneous recording, live viewing and playback.
- Independent live stream for every camera channel.
- RTSP output for every channel.
- ONVIF Profile S or T support where IP cameras are used.
- Documented API or SDK for integration.
- API must provide device status, camera channels and GPS/location data.
- Built-in 4G/LTE modem with an unlocked SIM slot.
- Compatible with the selected Ugandan mobile network operator. Supplier must confirm supported LTE frequency bands.
- Built-in GPS with external antenna.
- GPS information must include latitude, longitude, speed, direction and time.
- GPS data must be available through a documented API, protocol or server connection.
- Ethernet/LAN port for setup and maintenance.
- Wi-Fi is optional but preferred for depot downloads.
- At least one audio input/channel, preferably audio for each required camera.
- Ignition/ACC input.
- Configurable delayed shutdown after ignition is switched off.
- Safe shutdown to prevent recording corruption.
- Operating voltage covering 12V vehicle systems; 9–36V input preferred.
- Surge, over-voltage, under-voltage, reverse-polarity and short-circuit protection.
- Lockable storage compartment.
- Industrial operating temperature, preferably -20°C to 70°C.
- Vehicle anti-vibration and shock-resistant design.

---

## 4. SchoolRide integration requirements

The system must not be locked exclusively to the supplier's mobile application or cloud platform.

The supplier must provide:

- RTSP URL format for every live camera channel.
- Camera channel numbering and stream profiles.
- API/SDK documentation in English.
- GPS API or protocol documentation.
- A test account, test device or demonstration streams before final acceptance.
- Permission for the school to connect the equipment to its own server.
- Ability to change all administrator passwords.
- Ability to use the DVR without a compulsory long-term vendor cloud subscription.
- A method for secure remote access over 4G.

Because most mobile SIM connections use CGNAT, the DVR must support at least one of the following:

1. An outbound connection to the school's server;
2. A secure VPN such as WireGuard, OpenVPN or an equivalent;
3. A documented vendor server/API that permits SchoolRide integration; or
4. A SIM/APN service providing secure private or static-IP connectivity.

For browser viewing, SchoolRide will use a video gateway to convert RTSP into secure WebRTC or HLS. The supplier must cooperate with the SchoolRide technical team during this configuration.

---

## 5. Video and audio performance

- Main recording stream: minimum 1080p.
- Configurable secondary stream for remote viewing at lower bandwidth.
- Live-view latency target using WebRTC: below 2 seconds where network conditions permit.
- HLS may be used where low latency is not essential.
- Audio and video must remain reasonably synchronized.
- Audio must be configurable or disabled where required by school policy or law.
- Bitrate, resolution and frame rate must be adjustable per channel.
- The system must recover streaming automatically after temporary 4G signal loss.

---

## 6. Recording and storage

- Minimum 1 TB vehicle-rated SSD or sufficient high-endurance storage.
- Target retention: at least 14 days for four cameras under the agreed recording settings.
- Continuous and event-based recording modes.
- Old footage may be overwritten automatically after the retention period.
- Recordings must include correct date, time, van identity and camera channel.
- Search and playback by date, time and channel.
- Export recordings in a commonly playable format such as MP4.
- Recordings must continue locally when 4G is unavailable.
- Storage-failure alert required.

The supplier must state the expected number of recording days using the quoted storage, resolution, frame rate and bitrate.

---

## 7. Security and privacy

- Unique administrator password for every DVR.
- No universal or undocumented factory password.
- Role-based user accounts preferred.
- HTTPS/TLS or VPN protection for remote access.
- Signed or authenticated playback access.
- Ability to disable unused services and ports.
- Firmware upgrade procedure and security-update availability.
- Access logs preferred.
- Supplier must disclose whether video or GPS data is sent to any third-party cloud server.
- The school must retain ownership and administrative control of all video and GPS data.

---

## 8. Installation requirements

- Cameras must not obstruct the driver's view.
- Interior camera must cover passenger seats with minimal blind spots.
- Door camera must clearly show children entering and leaving.
- Exterior cameras must use waterproof connectors and protected cable routes.
- Wiring must be concealed, fused and secured against vibration and tampering.
- DVR must be installed in a ventilated, secure and lockable position.
- 4G and GPS antennas must be installed where signal reception is reliable.
- Installation must not interfere with airbags, vehicle electronics or emergency exits.
- Each camera and cable must be labelled.
- Supplier must provide an installation diagram and device/channel list.

---

## 9. Accessories to include in the quotation

- All four cameras.
- Mobile DVR/NVR.
- 1 TB or larger vehicle-rated storage.
- GPS antenna.
- 4G/LTE antenna.
- SIM-card holder or modem.
- Locking camera cables of suitable length.
- Power harness with ACC/ignition wire.
- Fuse, surge protection and voltage protection.
- Mounting brackets, screws, seals and weatherproof connectors.
- Optional panic button/event input.
- Optional driver monitor, if recommended.
- Installation, configuration and training.

---

## 10. Required supplier demonstration before purchase

The supplier must demonstrate all the following using the exact model being quoted:

- All four cameras visible simultaneously.
- Individual live stream for each channel.
- RTSP stream opened outside the vendor application.
- Live viewing remotely over a 4G SIM.
- GPS location obtained through the documented API or protocol.
- Recording while live viewing is active.
- Playback and MP4 export.
- Night-time interior and exterior image quality.
- Audio quality and synchronization.
- Recovery after 4G is disconnected and restored.
- Continued local recording without 4G.
- Correct delayed shutdown after ignition is turned off.

No final purchase approval should be issued until RTSP/API access and remote 4G operation have been demonstrated.

---

## 11. Acceptance tests after installation

The installation will be accepted only after:

1. Every camera is correctly positioned and labelled.
2. Passenger seats, entry door, road and selected rear/driver area are visible.
3. Night vision works inside and outside.
4. GPS location matches the actual van location.
5. SchoolRide can display each live camera feed.
6. SchoolRide can associate video with the correct van.
7. Remote viewing works over 4G.
8. Recording and playback work with the 4G connection removed.
9. Exported footage plays on a standard computer.
10. Power interruption does not corrupt stored recordings.
11. Administrator credentials, API documentation and configuration backups are handed to the school.

---

## 12. Warranty and support

- Minimum one-year equipment and installation warranty; two years preferred.
- Local technical support contact.
- Replacement procedure for failed cameras, storage or DVR.
- Firmware and security-update support.
- Supplier training for school administrators.
- Written quotation separating equipment, installation, SIM/data, cloud/server and annual support costs.

---

## 13. Supplier response

The supplier must provide:

- Manufacturer:
- Exact DVR/NVR model:
- Exact camera models:
- Country of manufacture:
- RTSP per channel: Yes / No
- ONVIF profile supported:
- API/SDK available: Yes / No
- GPS API available: Yes / No
- Own-server integration permitted: Yes / No
- Remote access method over 4G:
- Supported LTE bands:
- Storage type and capacity:
- Estimated recording retention:
- Warranty period:
- Installation cost:
- Equipment cost:
- Recurring cloud/server cost:
- Estimated monthly SIM/data cost:
- Delivery period:

**Supplier name and signature:** ______________________________

**Date:** ______________________________
