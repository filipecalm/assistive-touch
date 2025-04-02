import React, { useState, useEffect, useRef } from 'react'
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { lightColors, darkColors } from '../constants/colors'
import {
    VolumeManager,
    useRingerMode,
    RINGER_MODE,
    RingerModeType,
} from 'react-native-volume-manager'
import lightOff from '../assets/images/eco-light-off.png'
import lightOn from '../assets/images/eco-light.png'
import { Feather, Ionicons } from '@expo/vector-icons'

export default function Home() {
    const [hasPermission, setHasPermission] = useState(false)
    const [isTorchOn, setIsTorchOn] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [volumes, setVolumes] = useState({
        music: 0.5,
        ring: 0.5,
        alarm: 0.5,
        notification: 0.5,
        system: 0.5,
        call: 0.5,
    })
    const cameraRef = useRef(null)
    const [permission, requestPermission] = useCameraPermissions()

    const themeColors = isDarkMode ? darkColors : lightColors

    const { mode, error, setMode } = useRingerMode()

    const modeText = {
        [RINGER_MODE.silent]: 'Silent',
        [RINGER_MODE.normal]: 'Normal',
        [RINGER_MODE.vibrate]: 'Vibrate',
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
                    music: volumeData.volume ?? prev.music,
                    ring: volumeData.ring ?? prev.ring,
                    alarm: volumeData.alarm ?? prev.alarm,
                    notification: volumeData.notification ?? prev.notification,
                    system: volumeData.system ?? prev.system,
                    call: prev.call,
                }))
            } catch (error) {
                console.error('Erro ao obter volumes:', error)
            }
        })()

        const volumeListener = VolumeManager.addVolumeListener((result) => {
            setVolumes(prev => ({
                ...prev,
                music: result.volume ?? prev.music,
                ring: result.ring ?? prev.ring,
                alarm: result.alarm ?? prev.alarm,
                notification: result.notification ?? prev.notification,
                system: result.system ?? prev.system,
                call: prev.call,
            }))
        })

        return () => {
            if (volumeListener && typeof volumeListener.remove === 'function') {
                volumeListener.remove()
            }
        }
    }, [permission, requestPermission])

    // Função auxiliar para atualizar todos os volumes
    const updateAllVolumes = async (newVolume) => {
        await Promise.all(Object.keys(volumes).map((key) => VolumeManager.setVolume(newVolume, key)))
        setVolumes({
            music: newVolume,
            ring: newVolume,
            alarm: newVolume,
            notification: newVolume,
            system: newVolume,
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
    console.log('mode -->', mode)
    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <CameraView
                ref={cameraRef}
                style={styles.hiddenCamera}
                enableTorch={isTorchOn}
                facing="back"
            />
            <TouchableOpacity onPress={toggleTorch}>
                <Image style={styles.buttonImage} source={isTorchOn ? lightOn : lightOff} />
            </TouchableOpacity>

            {/* Controles de volume */}
            <View style={styles.volumeContainer}>
                {Object.entries(volumes).map(([type, value]) => (
                    <View key={type} style={styles.volumeRow}>
                        <Text style={[styles.volumeLabel, { color: themeColors.text }]}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}:
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
                <Text>Ringer Mode: {mode !== undefined ? modeText[mode] : null}</Text>

                <View style={{ flexDirection: 'row' }}>
                    {/* Modo Normal */}
                    <TouchableOpacity onPress={() => setMode(RINGER_MODE.normal)} style={styles.iconButton}>
                        <Ionicons name="volume-high" size={40} color={mode === RINGER_MODE.normal ? 'green' : 'black'} />
                    </TouchableOpacity>

                    {/* Modo Vibrar */}
                    <TouchableOpacity onPress={() => setMode(RINGER_MODE.vibrate)} style={styles.iconButton}>
                        <Ionicons name="volume-mute-outline" size={40} color={mode === RINGER_MODE.vibrate ? 'blue' : 'black'} />
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
