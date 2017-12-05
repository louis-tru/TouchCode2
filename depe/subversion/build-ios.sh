#!/bin/sh

IOS_MIN_SDK=8.0
PWD=`pwd`
OUT=${PWD}/out

mkdir -p ${OUT}
 
EXTRA_MAKE_FLAGS="-j4"
 
XCODEDIR=`xcode-select --print-path`

IOS_SDK=$(xcodebuild -showsdks | grep iphoneos | sort | head -n 1 | awk '{print $NF}')
SIM_SDK=$(xcodebuild -showsdks | grep iphonesimulator | sort | head -n 1 | awk '{print $NF}')

IPHONEOS_PLATFORM=${XCODEDIR}/Platforms/iPhoneOS.platform
IPHONEOS_SYSROOT=${IPHONEOS_PLATFORM}/Developer/SDKs/${IOS_SDK}.sdk

IPHONESIMULATOR_PLATFORM=${XCODEDIR}/Platforms/iPhoneSimulator.platform
IPHONESIMULATOR_SYSROOT=${IPHONESIMULATOR_PLATFORM}/Developer/SDKs/${SIM_SDK}.sdk

CC=clang
CXX=clang
CFLAGS="-DNDEBUG -DAPR_IOVEC_DEFINED -g -O0 -pipe -fPIC -std=c99 -miphoneos-version-min=${IOS_MIN_SDK}"
CXXFLAGS="${CFLAGS} -std=c++11 -stdlib=libc++ -fexceptions"
LDFLAGS="-stdlib=libc++ -miphoneos-version-min=${IOS_MIN_SDK}"
LIBS="-lc++ -lc++abi"

APR=`cd ./apr; pwd`/out
APU=`cd ./apr-util; pwd`/out
SERF=`cd ./serf; pwd`/out
ZLIB=`cd ../node/deps/zlib; pwd`

ARCHS="armv7 armv7s arm64 i386 x86_64"
# ARCHS="i386"

IFS=" "
arr=(${ARCHS})

for arch in ${arr[@]}; do

    echo "##################"
    echo " ${arch} for iPhone"
    echo "##################"
(
    cd ${PWD}

    if [ "$arch" == "i386" ] || [ "$arch" == "x86_64" ]; then
        SYSROOT=${IPHONESIMULATOR_SYSROOT}
    else
        SYSROOT=${IPHONEOS_SYSROOT}
    fi

    cd ${PWD}

    # --enable-all-static \
    # --with-serf=${with_serf} \
    
    ./configure \
        --build="i386-apple-darwin13.0.0" \
        --host="arm-apple-darwin" \
        --enable-static \
        --enable-shared \
        --prefix=${OUT}/ios/${arch} \
        --with-apr=${APR}/ios/${arch} \
        --with-apr-util=${APU}/ios/${arch} \
        --with-serf=${SERF}/ios/${arch} \
        --with-openssl \
        --enable-optimize \
        ac_cv_lib_z_inflate=yes \
        "CC=${CC}" \
        "CXX=${CXX}" \
        "CFLAGS=${CFLAGS} -arch ${arch} -isysroot ${SYSROOT}" \
        "CXXFLAGS=${CXXFLAGS} -arch ${arch} -isysroot ${SYSROOT}" \
        "LDFLAGS=${LDFLAGS} -arch ${arch}" \
        "LIBS=${LIBS}"
        
    rm -rf ${OUT}/ios/${arch}
    make clean
    make ${EXTRA_MAKE_FLAGS}
    make ${EXTRA_MAKE_FLAGS} install
)

done


mixd_build(){

    cd ${OUT}/ios

    if [ -f armv7/$1 ]; then ARMV7="${OUT}/ios/armv7/$1"; else ARMV7=; fi
    if [ -f armv7s/$1 ]; then ARMV7S="${OUT}/ios/armv7s/$1"; else ARMV7S=; fi
    if [ -f arm64/$1 ]; then ARM64="${OUT}/ios/arm64/$1"; else ARM64=; fi
    if [ -f i386/$1 ]; then I386="${OUT}/ios/i386/$1"; else I386=; fi
    if [ -f x86_64/$1 ]; then X86_64="${OUT}/ios/x86_64/$1"; else X86_64=; fi

    if [ ! -f ${OUT}/ios/mixd/$1 ]; then
        mkdir -p ${OUT}/ios/mixd/$1
        rm -rf ${OUT}/ios/mixd/$1
    fi

    lipo ${ARMV7} ${ARMV7S} ${ARM64} ${I386} ${X86_64} \
    -create -output \
    ${OUT}/ios/mixd/$1
}


echo "############################"
echo " Create Mixd Libraries"
echo "############################"
(
    cd ${OUT}

    rm -rf ios/mixd
    mkdir -p ios/mixd

    cd ios/armv7

    arr=(`find . -name *.a|xargs`)

    for s in ${arr[@]}; do
        `mixd_build $s`
    done
)

echo "done"

