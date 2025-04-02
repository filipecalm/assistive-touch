import React, { useState, useEffect, useRef } from 'react'
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { VolumeManager } from 'react-native-volume-manager'
import lightOff from '../assets/images/eco-light-off.png'
import lightOn from '../assets/images/eco-light.png'
import { lightColors, darkColors } from '../constants/colors'
import { Feather } from '@expo/vector-icons'

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
                    music: volumeData.music ?? prev.music,
                    ring: volumeData.ring ?? prev.ring,
                    alarm: volumeData.alarm ?? prev.alarm,
                    notification: volumeData.notification ?? prev.notification,
                    system: volumeData.system ?? prev.system,
                    call: volumeData.call ?? prev.call,
                }))
            } catch (error) {
                console.error('Erro ao obter volumes:', error)
            }
        })()
    }, [permission, requestPermission])

    const toggleTorch = () => {
        if (cameraRef.current) {
            setIsTorchOn(prev => !prev)
            setIsDarkMode(prev => !prev)
        }
    }

    const increaseVolume = async (type) => {
        const newVolume = Math.min(volumes[type] + 0.1, 1.0)
        await VolumeManager.setVolume(newVolume, type)
        setVolumes(prev => ({ ...prev, [type]: newVolume }))
    }

    const decreaseVolume = async (type) => {
        const newVolume = Math.max(volumes[type] - 0.1, 0.0)
        await VolumeManager.setVolume(newVolume, type)
        setVolumes(prev => ({ ...prev, [type]: newVolume }))
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
        width: '45%'
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
        width: '45%'
    },
})