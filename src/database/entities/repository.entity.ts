import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Repository {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        length: 100,
    })
    name: string


    @Column({
        length: 200,
    })
    url: string

    @Column({
        default: null
    })
    guildId?: string

    @Column({
        default: null
    })
    channelId?: string

    @Column({
        default: null
    })
    description?: string

    @Column({
        nullable: true
    })
    regex?: string

    @Column({
        type: "integer",
        default: 0
    })
    downloads: number
}