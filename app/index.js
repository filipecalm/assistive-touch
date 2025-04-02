import React, { useState, useEffect, useRef } from 'react'
import {
    View,
    Text,
    Image,
    Button,
    StyleSheet,
    TouchableOpacity,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { lightColors, darkColors } from '../constants/colors'
import {
    VolumeManager,
    useRingerMode,
    RINGER_MODE,
} from 'react-native-volume-manager'
import lightOff from '../assets/images/eco-light-off.png'
import lightOn from '../assets/images/eco-light.png'
import { Feather, Ionicons } from '@expo/vector-icons'
import CountryFlag from "react-native-country-flag"

export default function Home() {
    const [language, setLanguage] = useState('en')

    // Textos traduzidos
    const texts = {
        en: {
            ringerMode: 'Ringer Mode',
        },
        br: {
            ringerMode: 'Modo de Toque',
        },
    }

    // Tradução para os rótulos dos volumes
    const volumeLabels = {
        en: {
            system: 'System',
            music: 'Music',
            ring: 'Ring',
            alarm: 'Alarm',
            notification: 'Notification',
            call: 'Call',
        },
        br: {
            system: 'Sistema',
            music: 'Música',
            ring: 'Toque',
            alarm: 'Alarme',
            notification: 'Notificação',
            call: 'Chamada',
        },
    }

    const [hasPermission, setHasPermission] = useState(false)
    const [isTorchOn, setIsTorchOn] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [volumes, setVolumes] = useState({
        system: 0.5,
        music: 0.5,
        ring: 0.5,
        alarm: 0.5,
        notification: 0.5,
        call: 0.5,
    })
    const cameraRef = useRef(null)
    const [permission, requestPermission] = useCameraPermissions()

    const themeColors = isDarkMode ? darkColors : lightColors

    const { mode, error, setMode } = useRingerMode()

    const modeText = {
        [RINGER_MODE.silent]: language === 'en' ? 'Silent' : 'Silencioso',
        [RINGER_MODE.normal]: language === 'en' ? 'Normal' : 'Normal',
        [RINGER_MODE.vibrate]: language === 'en' ? 'Vibrate' : 'Vibrar',
    }

    useEffect(() => {
        if (!permission) return

        setHasPermission(permission.granted)
        if (!permission.granted) {
            (async () => {
                const newPermission = await requestPermission()
                setHasPermission(newPermission.granted)
            })()
        }

        (async () => {
            try {
                const volumeData = await VolumeManager.getVolume()
                setVolumes(prev => ({
                    ...prev,
                    system: volumeData.system ?? prev.system,
                    music: volumeData.volume ?? prev.music,
                    ring: volumeData.ring ?? prev.ring,
                    alarm: volumeData.alarm ?? prev.alarm,
                    notification: volumeData.notification ?? prev.notification,
                    call: prev.call,
                }))
            } catch (error) {
                console.error('Erro ao obter volumes:', error)
            }
        })()

        const volumeListener = VolumeManager.addVolumeListener((result) => {
            setVolumes(prev => ({
                ...prev,
                system: result.system ?? prev.system,
                music: result.volume ?? prev.music,
                ring: result.ring ?? prev.ring,
                alarm: result.alarm ?? prev.alarm,
                notification: result.notification ?? prev.notification,
                call: prev.call,
            }))
        })

        return () => {
            if (volumeListener && typeof volumeListener.remove === 'function') {
                volumeListener.remove()
            }
        }
    }, [permission, requestPermission])

    const updateAllVolumes = async (newVolume) => {
        await Promise.all(Object.keys(volumes).map((key) => VolumeManager.setVolume(newVolume, key)))
        setVolumes({
            system: newVolume,
            music: newVolume,
            ring: newVolume,
            alarm: newVolume,
            notification: newVolume,
            call: newVolume,
        })
    }

    const increaseVolume = async (type) => {
        if (type === 'system') {
            const newVolume = Math.min(volumes.system + 0.1, 1.0)
            await updateAllVolumes(newVolume)
        } else {
            const newVolume = Math.min(volumes[type] + 0.1, 1.0)
            await VolumeManager.setVolume(newVolume, type)
            setVolumes(prev => ({ ...prev, [type]: newVolume }))
        }
    }

    const decreaseVolume = async (type) => {
        if (type === 'system') {
            const newVolume = Math.max(volumes.system - 0.1, 0.0)
            await updateAllVolumes(newVolume)
        } else {
            const newVolume = Math.max(volumes[type] - 0.1, 0.0)
            await VolumeManager.setVolume(newVolume, type)
            setVolumes(prev => ({ ...prev, [type]: newVolume }))
        }
    }

    const toggleTorch = () => {
        if (cameraRef.current) {
            setIsTorchOn(prev => !prev)
            setIsDarkMode(prev => !prev)
        }
    }

    if (hasPermission === null) {
        return <View />
    }

    if (hasPermission === false) {
        return (
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <Text style={{ color: themeColors.text }}>Permissão negada</Text>
                <TouchableOpacity onPress={requestPermission}>
                    <Text style={{ color: themeColors.primary }}>Solicitar permissão</Text>
                </TouchableOpacity>
            </View>
        )
    }

    const iconColorNormal = mode === RINGER_MODE.normal ? 'green' : (isDarkMode ? 'white' : 'black');
    const iconColorVibrate = mode === RINGER_MODE.vibrate ? 'blue' : (isDarkMode ? 'white' : 'black');

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* Botão para alternar idioma */}

            <View style={{ flexDirection: 'row', alignSelf: 'flex-end', justifyContent: 'flex-end', gap: 10, marginHorizontal: 10 }}>
                <TouchableOpacity onPress={() => setLanguage('en')}>
                    <CountryFlag isoCode="us" size={25} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setLanguage('br')}>
                    <CountryFlag isoCode="br" size={25} />
                </TouchableOpacity>
            </View>

            <CameraView
                ref={cameraRef}
                style={styles.hiddenCamera}
                enableTorch={isTorchOn}
                facing="back"
            />
            <TouchableOpacity onPress={toggleTorch}>
                <Image style={styles.buttonImage} source={isTorchOn ? lightOn : lightOff} />
            </TouchableOpacity>

            <View style={styles.volumeContainer}>
                {Object.entries(volumes).map(([type, value]) => (
                    <View key={type} style={styles.volumeRow}>
                        <Text style={[styles.volumeLabel, { color: themeColors.text }]}>
                            {volumeLabels[language][type]}:
                        </Text>
                        <View style={styles.volumeControls}>
                            <TouchableOpacity
                                style={[styles.volumeButton, { backgroundColor: themeColors.primary }]}
                                onPress={() => decreaseVolume(type)}
                            >
                                <Feather name="minus-circle" size={22} color={themeColors.text} />
                            </TouchableOpacity>
                            <Text
                                style={[styles.volumeDisplay, { color: themeColors.text, borderColor: themeColors.primary }]}
                            >
                                {(value * 100).toFixed(0)}%
                            </Text>
                            <TouchableOpacity
                                style={[styles.volumeButton, { backgroundColor: themeColors.primary }]}
                                onPress={() => increaseVolume(type)}
                            >
                                <Feather name="plus-circle" size={22} color={themeColors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
            <View>
                <Text
                    style={{ color: themeColors.text, borderColor: themeColors.primary }}
                >
                    {texts[language].ringerMode}: {mode !== undefined ? modeText[mode] : null}</Text>

                <View style={{ flexDirection: 'row' }}>
                    {/* Modo Normal */}
                    <TouchableOpacity onPress={() => setMode(RINGER_MODE.normal)} style={styles.iconButton}>
                        <Ionicons name="volume-high" size={40} color={iconColorNormal} />
                    </TouchableOpacity>

                    {/* Modo Vibrar */}
                    <TouchableOpacity onPress={() => setMode(RINGER_MODE.vibrate)} style={styles.iconButton}>
                        <Ionicons name="volume-mute-outline" size={40} color={iconColorVibrate} />
                    </TouchableOpacity>
                </View>


                <View>
                    <Text>{error?.message}</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hiddenCamera: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },
    buttonImage: {
        width: 80,
        height: 80,
        resizeMode: 'cover',
    },
    volumeContainer: {
        width: '100%',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    volumeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginVertical: 10,
    },
    volumeLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    volumeControls: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '45%',
    },
    volumeButton: {
        padding: 10,
        borderRadius: 5,
    },
    volumeDisplay: {
        height: 50,
        fontSize: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        paddingHorizontal: 10,
        textAlignVertical: 'center',
        textAlign: 'center',
        width: '45%',
    },
    iconButton: {
        padding: 10,
    },
})
